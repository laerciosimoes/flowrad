from typing import Optional

from pydantic import BaseModel


class PatientData(BaseModel):
    age: int
    sex: str
    weight: float
    indication: str
    creatinine: Optional[float] = None
    allergies_str: Optional[str] = None