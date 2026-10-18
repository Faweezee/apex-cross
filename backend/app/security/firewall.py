"""Adversarial prompt injection and jailbreak firewall."""
import re
from typing import Tuple

SUSPICIOUS_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+(instructions|directives)",
    r"(?i)system\s*:\s*override",
    r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
    r"(?i)bypass\s+(security|permission|guardrail)",
    r"(?i)wire\s+(all\s+funds|everything)\s+to",
    r"(?i)transfer\s+without\s+(confirmation|passkey|auth)",
    r"(?i)grant\s+(admin|root|unrestricted)\s+access",
    r"(?i)<script\b[^>]*>",
    r"(?i)(\bselect\b|\bunion\b|\bdrop\b).*\bfrom\b"
]

class SecurityFirewall:
    def __init__(self):
        self.compiled_rules = [re.compile(p) for p in SUSPICIOUS_PATTERNS]

    def sanitize_and_inspect(self, user_prompt: str) -> Tuple[bool, str]:
        """
        Inspects input for malicious adversarial patterns.
        Returns: (is_safe: bool, reason: str)
        """
        if not user_prompt or len(user_prompt.strip()) == 0:
            return False, "Empty prompt provided."

        if len(user_prompt) > 4000:
            return False, "Prompt exceeds maximum allowable token limit."

        for rule in self.compiled_rules:
            if rule.search(user_prompt):
                return False, f"Malicious pattern detected: {rule.pattern}"

        return True, "Input validated safe."
