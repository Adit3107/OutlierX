import re

class SemanticVersion:
    def __init__(self, version_str: str):
        self.raw = version_str
        cleaned = version_str.lstrip('v')
        parts = cleaned.split('.')
        self.major = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1
        self.minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        self.patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0

    def __lt__(self, other: 'SemanticVersion') -> bool:
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

    def __eq__(self, other: 'SemanticVersion') -> bool:
        return (self.major, self.minor, self.patch) == (other.major, other.minor, other.patch)

    def __repr__(self) -> str:
        return f"v{self.major}.{self.minor}.{self.patch}"

def validate_semver(version_str: str) -> bool:
    pattern = r"^v?\d+\.\d+\.\d+$"
    return bool(re.match(pattern, version_str))
