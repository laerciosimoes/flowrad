import re
from typing import List, Optional, Dict, Any, Tuple
from patient import Patient

class CTProtocolAdvisor:
    def __init__(self):
        # NLP Keyword Mappings
        self.keyword_map = {
            "neuro": {
                r"trauma|hemorrhage|tbi": "brain_noncontrast",
                r"stroke|avc|aneurysm|hemiparesis": "brain_angio",
                r"pituitary|prolactinoma": "pituitary_dynamic",
                r"brain death": "brain_death",
                r"neuroinfection|hiv": "brain_contrast"
            },
            "head_neck": {
                r"larynx|vocal cord|hoarseness": "headneck_larynx",
                r"parotid|salivary": "headneck_parotid",
                r"oral tongue|tongue": "headneck_oral",
                r"thyroid|thyroglossal": "headneck_thyroid",
                r"temporal bone|otitis|otosclerosis": "headneck_temporal",
                r"tumor|acquired facial paralysis|abscess": "headneck_temporalc",
                r"orbital trauma|graves disease": "headneck_orbit",
                r"orbital infection": "headneck_orbitc",
                r"orbital vascular|orbital tumor|leukoria": "headneck_orbitnc",
                r"facial trauma|facial deformities": "headneck_facial",
                r"facial abscess|facial tumor|vascular lesion": "headneck_facialc",
                r"sinusitis|polyposis": "headneck_sinus",
                r"sinus abscess|sinus tumor": "headneck_sinusc",
                r"parathyroid": "headneck_4d"
            },
            "chest": {
                r"pulmonary embolism|pulmonary thromboembolism|pe": "pe_study",
                r"aortic dissection": "aorta_dissection",
                r"airway disease|copd|asthma|interstitial|post-lung transplant|post-lung tx": "chest_airway",
                r"pneumonia|checkup|lung infection|bronchopneumonia": "classic_chest",
                r"chest tumor|pleural disease|vasculitis": "chest_cc"
            },
            "abdomen": {
                r"liver mass|liver nodule|hcc|cirrhosis|liver's cirrhosis": "liver_triphasic",
                r"pancreatic mass|pancreatitis": "pancreas_GI",
                r"crohn": "entero-CT",
                r"mesenteric ischemia|vascular acute abdomen": "mesenteric_ischemia",
                r"esophagitis|esophagus staging": "esophagus_GI",
                r"stomach staging|gist": "stomach_GI",
                r"colitis|lymphoma|portal staging": "portal_GI",
                r"hypervascular tumors": "hypervascular_GI",
                r"adrenal mass|adrenal adenoma": "adrenal_protocol"
            },
            "gu": {
                r"renal mass|rcc|renal cell carcinoma": "renal_mass",
                r"adrenal|adrenal adenoma": "adrenal_protocol", # Redundant with abdomen but kept for GU context
                r"bladder fistula": "cystogram", # Note: cystogram not in protocols db, needs to be added or clarified
                r"lithiasis|kidney stone|renal colic": "urolithiasis"
            },
            "angio": {
                r"dvt|venous thromboembolism": "venogram_legs",
                r"nutcracker": "nutcracker_syndrome" # Note: nutcracker_syndrome not in protocols db, needs to be added
            }
        }


        # Full Protocol Database
        self.protocols = {
            # NEURO
            "brain_noncontrast": {
                "indications": ["trauma", "hemorrhage", "TBI"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "slice_thickness": "5mm",
                "coverage": "Above C2"
            },
            "brain_contrast": {
                "indications": ["neuroinfection", "HIV"],
                "contrast": "50mL flow 4mL/s",
                "phases": ["non_contrast", "parenchymal (60s)"],
                "coverage": "above C2",
                "slice_thickness": "5mm"
            },
            "brain_angio": {
                "indications": ["stroke", "aneurysm", "hemiparesis"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "arterial"],
                "coverage": "aortic arch to vertex",
                "slice_thickness": "1mm"
            },
            "pituitary_dynamic": {
                "indications": ["pituitary lesions", "prolactinoma"],
                "contrast": "1.0 mL/kg",
                "phases": ["25-sec", "60-sec", "90-sec"],
                "slice_thickness": "1mm",
                "coverage": "Pituitary gland"
            },
            "brain_death": {
                "indications": ["brain death confirmation"],
                "contrast": "60mL flow 4mL/s",
                "phases": ["arterial (20-sec)", "late (60s)"], # NO non-contrast phase for brain death
                "coverage": "above C2",
                "slice_thickness": "5mm"
            },

            # HEAD/NECK
            "headneck_nc": { # General Head/Neck Non-Contrast
                "indications": ["lipoma", "upper airway stenosis"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["coverage from skull base to carina"],
                "slice_thickness": "1.5-3mm"
            },
            "headneck_thyroid": {
                "indications": ["thyroid lesions", "thyroglossal duct cysts"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["NO iodine contrast if goiter or before radioiodine therapy (unless specified)"],
                "coverage": "Mandible to sternal notch"
            },
            "headneck_larynx": {
                "indications": ["larynx tumors", "vocal cord paralysis", "hoarseness"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["additional acquisitions with phonation and modified Valsalva maneuvers from hyoid bone to upper trachea"],
                "coverage": "Hyoid bone to upper trachea"
            },
            "headneck_parotid": {
                "indications": ["parotid tumors", "salivary gland lesions"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["if a malignant lesion is suspected, add neck acquisition"],
                "coverage": "Skull base to hyoid bone"
            },
            "headneck_oral": {
                "indications": ["oral cavity tumor", "oral tongue tumor"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["add neck acquisition; inflated cheeks for tumors of the buccal mucosa or oral tongue; open mouth for oral tongue tumors with metallic dental restorations"],
                "coverage": "Skull base to carina"
            },
            "headneck_temporal": { # Temporal bone without contrast
                "indications": ["otitis media", "otosclerosis", "cholesteatoma"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["high resolution temporal bone CT"]
            },
            "headneck_temporalc": { # Temporal bone with contrast
                "indications": ["tumor", "acquired facial paralysis", "abscess"],
                "contrast": "1.3 mL/kg", # Assuming contrast for infection/tumor
                "phases": ["post_contrast (60s)"],
                "notes": ["contrast-enhanced temporal bone CT"]
            },
            "headneck_orbit": { # Orbits without contrast
                "indications": ["orbital trauma", "Graves' disease"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["no contrast CT orbits"]
            },
            "headneck_orbitc": { # Orbits with contrast for infection
                "indications": ["infection", "orbital cellulitis"],
                "contrast": "1.3 mL/kg",
                "phases": ["post_contrast (60s)"],
                "notes": ["contrast-enhanced CT orbits"]
            },
            "headneck_orbitnc": { # Orbits with non-contrast and contrast for vascular/tumor
                "indications": ["vascular disease", "orbital tumor", "leukoria"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
            },
            "headneck_facial": { # Facial bones without contrast
                "indications": ["facial trauma", "congenital facial deformities", "fibro-osseous lesions"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["add 3D reconstructions"]
            },
            "headneck_facialc": { # Facial bones with contrast
                "indications": ["abscess", "facial tumor", "vascular lesion"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["if a malignant tumor is suspected, add neck acquisition"]
            },
            "headneck_sinus": { # Sinuses without contrast
                "indications": ["sinusitis", "polyposis"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["if a malignant tumor is suspected, add neck acquisition"]
            },
            "headneck_sinusc": { # Sinuses with contrast
                "indications": ["sinus abscess", "sinus tumor"],
                "contrast": "1.3 mL/kg", # Assuming contrast for infection/tumor
                "phases": ["non_contrast", "post_contrast (60s)"],
                "notes": ["if a malignant lesion is suspected, add neck acquisition"]
            },
            "headneck_4d": {
                "indications": ["localize abnormal parathyroid glands"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "arterial(30s)", "late(60s)"],
                "notes": ["coverage from skull base to carina"],
                "slice_thickness": "1mm"
            },

            # CHEST
            "classic_chest": {
                "indications": ["pneumonia", "check-up", "lung infection"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "coverage": "Lung apices to costophrenic angles"
            },
            "chest_cc": { # Chest with contrast
                "indications": ["tumors", "pleural disease", "vasculitis", "lymphoma"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "with_contrast (60s)"],
                "coverage": "Lung apices to costophrenic angles"
            },
            "pe_study": {
                "indications": ["PE", "pulmonary embolism", "hemoptysis"],
                "contrast": "60-100mL flow 4mL/s",
                "phases": ["bolus track PA (120HU)"],
                "coverage": "Lung apices to diaphragm"
            },
            "aorta_dissection": {
                "indications": ["aortic dissection", "aortic aneurysm rupture"],
                "contrast": "85mL + 60mL saline flow 4mL/s",
                "phases": ["non_contrast", "angio (arterial)"],
                "coverage": "Neck to pelvis"
            },
            "chest_airway": {
                "indications": ["COPD", "asthma", "interstitial lung disease", "post-lung transplant"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "notes": ["inspiratory + expiratory acquisitions"],
                "coverage": "Lung apices to costophrenic angles"
            },

            # GI (Abdomen/Pelvis)
            "liver_triphasic": {
                "indications": ["HCC", "liver mass", "cirrhosis", "metastases"],
                "contrast": "1.6 mL/kg",
                "phases": ["non_contrast", "late arterial (40s)", "portal (70s)", "delayed (180s)"],
                "coverage": "Diaphragm to iliac crest"
            },
            "pancreas_GI": {
                "indications": ["pancreatitis", "pancreatic mass", "pancreatic lesions"],
                "contrast": "1.6 mL/kg",
                "phases": ["non_contrast", "late arterial (40s)", "portal (70s)", "delayed (180s)"],
                "coverage": "Diaphragm to iliac crest"
            },
            "esophagus_GI": {
                "indications": ["esophagitis", "esophageal staging"],
                "contrast": "1.6 mL/kg",
                "phases": ["non_contrast", "late arterial (40s)", "portal (70s)"],
                "notes": ["portal phase should include a chest CT"],
                "coverage": "Neck to upper abdomen"
            },
            "stomach_GI": {
                "indications": ["stomach staging", "GIST"],
                "contrast": "1.6 mL/kg",
                "phases": ["late arterial (40s)", "portal (70s)"],
                "notes": ["add non-contrast phase if GIST is suspected"],
                "coverage": "Diaphragm to iliac crest"
            },
            "entero-CT": {
                "indications": ["Crohn's disease", "small bowel pathology"],
                "contrast": "Split-bolus IV + oral MCN",
                "phases": ["arterial", "enterographic (50s)"],
                "prep": "Buscopan IV + 1.5L MCN over 1h",
                "coverage": "Diaphragm to pelvis"
            },
            "portal_GI": { # General abdomen/pelvis portal phase for staging/inflammation
                "indications": ["staging", "colitis", "lymphoma", "infection"],
                "contrast": "1.6 mL/kg",
                "phases": ["portal (70s)"],
                "coverage": "Diaphragm to pelvis"
            },
            "hypervascular_GI": {
                "indications": ["hypervascular tumors (breast cancer, sarcomas, melanomas, choriocarcinoma)"],
                "contrast": "1.6 mL/kg",
                "phases": ["non_contrast (upper abdomen)", "late arterial (40s, upper abdomen)", "portal venous (70s, upper abdomen and pelvis)", "delayed phase (15 min, upper abdomen)"],
                "coverage": "Diaphragm to pelvis"
            },
            "adrenal_protocol": {
                "indications": ["evaluation of adrenal nodules", "differentiation of adenomas from hypervascular tumors"],
                "contrast": "1.6 mL/kg",
                "phases": ["non_contrast", "late arterial (40s)", "portal (70s)",  "delayed phase (15 min)"],
                "coverage": "Adrenal glands"
            },

            # GU
            "renal_mass": {
                "indications": ["RCC", "renal mass", "complex cysts"],
                "contrast": "1.3 mL/kg",
                "phases": ["non_contrast", "nephrographic (100s)", "excretory (10min)"],
                "prep": "bladder moderately full",
                "coverage": "Kidneys and urinary tract"
            },
            "urolithiasis": {
                "indications": ["kidney stones", "renal colic", "lithiasis"],
                "contrast": "none",
                "phases": ["non_contrast"],
                "slice_thickness": "1mm",
                "notes": "Prone if UVJ stone suspected",
                "coverage": "Kidneys to bladder"
            },
            "cystogram": { # Added missing protocol for bladder fistula
                "indications": ["bladder fistula", "bladder integrity"],
                "contrast": "bladder contrast (via foley)",
                "phases": ["post_fill", "post_void"],
                "notes": "Retrograde filling of bladder with diluted contrast",
                "coverage": "Pelvis"
            },

            # ANGIO
            "venogram_legs": {
                "indications": ["DVT", "venous thromboembolism"],
                "contrast": "1.7 mL/kg",
                "phases": ["venous (180s delay)"],
                "coverage": "celiac to toes"
            },
            "nutcracker_syndrome": { # Added missing protocol for nutcracker syndrome
                "indications": ["nutcracker syndrome", "renal vein compression"],
                "contrast": "1.5 mL/kg",
                "phases": ["arterial", "venous"],
                "coverage": "Renal arteries and veins"
            }
        }

    def match_protocol(self, indication_text: str) -> List[str]:
        """NLP-based protocol matching - returns multiple protocols if more than one match."""
        indication_text = indication_text.lower()
        matches = []
        for category, keywords in self.keyword_map.items():
            for pattern, protocol_name in keywords.items():
                if re.search(pattern, indication_text):
                    matches.append(protocol_name)
        return list(set(matches)) # Return unique matches

    def get_protocol_details(self, protocol_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves full details for a given protocol name."""
        return self.protocols.get(protocol_name)

    def check_safety(self, patient: Patient, protocol_name: str) -> (bool, List[str]):
        """Checks for contraindications and warnings based on patient and protocol."""
        is_safe = True
        messages = []

        protocol = self.protocols.get(protocol_name)
        if not protocol:
            return False, ["Protocol not found."]

        # Extrai a informação de contraste para verificar se o protocolo a utiliza
        uses_contrast = protocol.get("contrast") and protocol.get("contrast").lower() not in ["none", "bladder contrast (via foley)"]

        # Contraindication checks:
        if "iodine" in patient.allergies and uses_contrast:
            is_safe = False
            messages.append("CONTRAINDICATION: Contrast is contraindicated due to a history of SEVERE iodine allergy.")

        # Modificação aqui: TFG < 30 agora é uma contraindicação
        gfr_value = patient.calculate_gfr()
        if gfr_value < 30 and uses_contrast:
            is_safe = False
            messages.append(f"CONTRAINDICATION: Contrast not recommended due to severe renal impairment (GFR = {gfr_value:.1f}). Proceed only after risk-benefit analysis with the medical team.")
        elif 30 <= gfr_value < 60 and uses_contrast:
            messages.append(f"WARNING: Moderate renal impairment (GFR = {gfr_value:.1f}). Consider reduced contrast dose or alternative imaging. Discuss with medical team.")

        # Warning checks:
        if patient.weight > 150: # Example limit, adjust as per scanner
            messages.append("WARNING: Patient weight may exceed the scanner's table limit (>150kg). Please verify.")

        return is_safe, messages

    def calculate_contrast_dose(self, contrast_str: str, patient_weight: float) -> str:
        """Calculate final contrast volume if dose is weight-based.
        Args:
            contrast_str: Protocol's contrast description (e.g., "1.5 mL/kg")
            patient_weight: Patient's weight in kg
        Returns:
            Formatted string (e.g., "1.5 mL/kg → 105 mL") or original if not applicable.
        """
        if not contrast_str or patient_weight <= 0:
            return contrast_str

        match = re.search(r"(\d+\.?\d*)\s*mL/kg", contrast_str)
        if match:
            dose_per_kg = float(match.group(1))
            total_dose = dose_per_kg * patient_weight
            return f"{contrast_str} → {total_dose:.1f} mL"

        return contrast_str
