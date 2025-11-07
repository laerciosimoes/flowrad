
from typing import Optional, List

class Patient:
    def __init__(self, age: int, sex: str, weight: float, indication: str, creatinine: Optional[float] = None, allergies: Optional[List[str]] = None):
        self.age = age
        self.sex = sex.upper()
        self.weight = weight
        self.indication = indication.lower()
        self.creatinine = creatinine
        self.allergies = [a.strip().lower() for a in allergies] if allergies else []

    def calculate_gfr(self) -> float:
        """CKD-EPI equation for GFR estimation"""
        if not self.creatinine or self.creatinine <= 0:
            return 90.0  # Default normal value if creatinine is not provided or invalid

        k = 0.7 if self.sex == 'F' else 0.9
        alpha = -0.329 if self.sex == 'F' else -0.411
        # Ensure that (self.creatinine / k) is not zero before taking log in real calculation,
        # but for this specific CKD-EPI formula, it uses min/max (creatinine/k, 1) to handle values.
        # This implementation closely follows the standard formula.
        
        # Handle cases where creatinine/k might be very small, approaching zero, which can cause issues with power functions
        ratio_k = self.creatinine / k
        
        term1 = min(ratio_k, 1)**alpha
        term2 = max(ratio_k, 1)**-1.209
        
        gfr = 141 * term1 * term2 * (0.993**self.age)
        
        if self.sex == 'F':
            gfr *= 1.018 # Factor for females
        
        # Ethiopian specific race factor, not included in generic CKD-EPI without specific request.
        # if 'black' in self.ethnicity:
        #     gfr *= 1.159
            
        return gfr if gfr > 0 else 0.1 # Ensure GFR is never non-positive
