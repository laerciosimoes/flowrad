import os
from typing import List, Optional
import dotenv
import uuid

from langchain_openai import ChatOpenAI
from langchain_core.tools import Tool
from langchain.agents import create_agent  # Updated import
from langgraph.checkpoint.memory import MemorySaver
import sys
sys.path.append(os.path.dirname(__file__))

from patient import Patient
from ctProtocolAdvisor import CTProtocolAdvisor
from fastapi import FastAPI
from patientData import PatientData

# Load environment variables from .env file
dotenv.load_dotenv()

app = FastAPI(title="CT Protocol Advisor API")


# Initialize the advisor (singleton instance)
advisor_instance = CTProtocolAdvisor()

# Global variable to store the current patient object
current_patient: Optional[Patient] = None


# --- LangChain Tools ---
def get_patient_info(patient_info: str) -> str:
    """Captures and stores patient information from a formatted string containing age, sex, weight, clinical indication,
    optional creatinine level, and optional allergies.
    Expected format: 'age: X, sex: Y, weight: Z, indication: ABC, creatinine: N, allergies: XYZ'
    Returns a confirmation string of the patient's data."""

    try:
        # Parse the patient info string
        info_parts = {}
        for part in patient_info.split(','):
            if ':' in part:
                key, value = part.split(':', 1)
                info_parts[key.strip().lower()] = value.strip()
        
        # Extract required fields
        age = int(info_parts.get('age', 0))
        sex = info_parts.get('sex', '').upper()
        weight = float(info_parts.get('weight', 0))
        indication = info_parts.get('indication', '')
        
        # Extract optional fields
        creatinine_str = info_parts.get('creatinine', '')
        creatinine = float(creatinine_str) if creatinine_str and creatinine_str.lower() != 'none' else None
        
        allergies_str = info_parts.get('allergies', '')
        allergies = [a.strip() for a in allergies_str.split(',')] if allergies_str and allergies_str.lower() != 'none' else []
        
        global current_patient
        current_patient = Patient(age, sex, weight, indication, creatinine, allergies)

        gfr = current_patient.calculate_gfr()
        creatinine_info = (
            f"Creatinine: {creatinine} mg/dL, GFR: {gfr:.1f}"
            if creatinine is not None else "Creatinine: Not provided"
        )
        allergies_info = (
            f"Allergies: {', '.join(allergies)}" if allergies else "No known allergies"
        )

        return (
            f"Patient data collected:\n"
            f"Age: {age}, Sex: {sex}, Weight: {weight}kg\n"
            f"Indication: {indication}\n{creatinine_info}\n{allergies_info}"
        )
        
    except Exception as e:
        return f"Error parsing patient information: {str(e)}"

def match_ct_protocol(indication: str) -> List[str]:
    """Matches a clinical indication to one or more potential CT protocols."""
    return advisor_instance.match_protocol(indication)


def get_protocol_details_tool(protocol_name: str, patient_weight: Optional[float] = None) -> str:
    """Retrieves the detailed information for a specific CT protocol."""
    protocol = advisor_instance.get_protocol_details(protocol_name)
    if not protocol:
        return f"Protocol '{protocol_name}' not found."

    details = [f"Protocol Name: {protocol_name.upper()}"]
    details.append(f"Indications: {', '.join(protocol.get('indications', []))}")

    contrast_info = protocol.get('contrast', 'None')
    if patient_weight is not None:
        contrast_info = advisor_instance.calculate_contrast_dose(contrast_info, patient_weight)
    details.append(f"Contrast: {contrast_info}")

    if protocol.get('phases'):
        details.append(f"Phases: {', '.join(protocol['phases'])}")
    if protocol.get('slice_thickness'):
        details.append(f"Slice Thickness: {protocol['slice_thickness']}")
    if protocol.get('coverage'):
        details.append(f"Coverage: {protocol['coverage']}")
    if protocol.get('prep'):
        details.append(f"Preparation: {protocol['prep']}")
    if protocol.get('notes'):
        details.append(f"Notes: {protocol['notes']}")

    return "\n".join(details)


def check_protocol_safety(protocol_name: str) -> str:
    """Checks the safety of a given protocol against the stored patient’s data."""
    global current_patient
    if 'current_patient' not in globals() or current_patient is None:
        return "Error: Patient information has not been set. Please provide patient details first."

    is_safe, messages = advisor_instance.check_safety(current_patient, protocol_name)

    if is_safe and not messages:
        return f"Safety Check: Protocol '{protocol_name.upper()}' is SAFE for this patient."
    elif is_safe:
        return (
            f"Safety Check: Protocol '{protocol_name.upper()}' has WARNINGS:\n"
            + "\n".join(f"- {msg}" for msg in messages)
        )
    else:
        return (
            f"Safety Check: Protocol '{protocol_name.upper()}' has CONTRAINDICATIONS:\n"
            + "\n".join(f"- {msg}" for msg in messages)
        )


# --- LangGraph Agent Setup ---

def setup_ct_advisor_agent():
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    tools = [
        Tool(
            name="GetPatientInfo",
            func=get_patient_info,
            description="Registers patient data. Input should be a formatted string like: 'age: 25, sex: M, weight: 70, indication: chest pain, creatinine: 1.0, allergies: none'",
        ),
        Tool(
            name="MatchCTProtocol",
            func=match_ct_protocol,
            description="Matches the indication to possible CT protocols.",
        ),
        Tool(
            name="GetProtocolDetails",
            func=get_protocol_details_tool,
            description="Retrieves details for a given CT protocol.",
        ),
        Tool(
            name="CheckProtocolSafety",
            func=check_protocol_safety,
            description="Checks the protocol safety based on patient data.",
        ),
    ]

    memory = MemorySaver()
    agent = create_agent(model=llm, tools=tools, checkpointer=memory)
    return agent

@app.post("/analyze-patient")
async def analyze_patient(patient_data: PatientData):
    try:
        agent_executor = setup_ct_advisor_agent()
        
        query = (
            f"Patient age {patient_data.age}, sex {patient_data.sex}, weight {patient_data.weight}kg, "
            f"indication '{patient_data.indication}', creatinine {patient_data.creatinine}, "
            f"allergies '{patient_data.allergies_str}'. "
            f"What is the recommended CT protocol and its safety status?"
        )
        

        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
            
        result = agent_executor.invoke({"messages": [("user", query)]}, config=config)

        return {
            "status": "success",
            "recommendation": result["messages"][-1].content
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/")
async def root():
    return {"message": "CT Protocol Advisor API"}


# --- Main CLI Loop ---

def run_agent_interaction():
    agent_executor = setup_ct_advisor_agent()

    print("\n=== AI CT PROTOCOL ADVISOR ===")
    print("Please provide patient details (type 'exit' to quit).")

    while True:
        try:
            age_str = input("\nAge: ")
            if age_str.lower() == 'exit':
                break
            age = int(age_str)

            sex = input("Sex (M/F): ").upper()
            while sex not in ['M', 'F']:
                sex = input("Please enter M or F: ").upper()

            weight = float(input("Weight (kg): "))
            indication = input("Clinical indication: ")
            creatinine_input = input("Creatinine (mg/dL, press Enter if not available): ")
            creatinine = float(creatinine_input) if creatinine_input else None

            allergies_input = input("Known severe allergy to iodine contrast? (y/n): ").lower()
            allergies_str = "iodine" if allergies_input == 'y' else ""

            query = (
                f"Patient age {age}, sex {sex}, weight {weight}kg, "
                f"indication '{indication}', creatinine {creatinine}, allergies '{allergies_str}'. "
                f"What is the recommended CT protocol and its safety status?"
            )

            print("\nThinking...\n")
 
            thread_id = str(uuid.uuid4())
            config = {"configurable": {"thread_id": thread_id}}
            
            result = agent_executor.invoke({"messages": [("user", query)]}, config=config)

            print("\n" + "=" * 70)
            print("Final Agent Response:")
            print(result["messages"][-1].content)
            print("=" * 70 + "\n")

        except Exception as e:
            print(f"Error: {e}")

        another = input("Process another patient? (y/n): ").lower()
        if another != 'y':
            break


if __name__ == "__main__":
    run_agent_interaction()
