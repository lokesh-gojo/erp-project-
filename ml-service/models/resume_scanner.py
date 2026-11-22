"""
PREP-TRACK ML Service: AI Resume & ATS Placement Scanner
Extracts and analyzes candidate resumes (PDF, DOCX, TXT):
1. ATS Formatting & Keyword Compliance Score (0 - 100%)
2. Skill Density & Multi-Tier Placement Match (Tier 1 Product, Tier 2 Specialist, Tier 3 Mass)
3. Missing High-Priority Keywords & Technology Gaps
4. Actionable Bullet Point Enhancements & Impact Rephrasings
"""

import io
import re
import math
from typing import Dict, Any, List, Optional
import pypdf

class ResumeScanner:
    def __init__(self):
        # High-priority skills taxonomy mapped to recruitment tiers
        self.tier1_skills = {
            "algorithms", "data structures", "system design", "distributed systems",
            "microservices", "docker", "kubernetes", "cloud", "aws", "gcp", "azure",
            "concurrency", "multithreading", "sql", "postgresql", "nosql", "redis",
            "graphql", "rest api", "ci/cd", "linux", "c++", "java", "golang", "python"
        }
        
        self.tier2_skills = {
            "react", "angular", "vue", "node.js", "express", "django", "flask",
            "spring boot", "mongodb", "mysql", "git", "github", "tailwind",
            "typescript", "javascript", "unit testing", "agile", "scrum", "object oriented"
        }
        
        self.tier3_skills = {
            "c", "java", "python", "html", "css", "sql", "dbms", "oop",
            "operating systems", "computer networks", "problem solving", "communication",
            "teamwork", "analytical skills"
        }

        self.action_verbs = {
            "developed", "designed", "implemented", "engineered", "optimized",
            "architected", "deployed", "spearheaded", "accelerated", "reduced",
            "increased", "built", "created", "automated", "achieved", "led"
        }

    def extract_text(self, file_name: str, file_bytes: bytes, text_override: Optional[str] = None) -> str:
        """Extract plain text from PDF, DOCX, or raw text."""
        if text_override and text_override.strip():
            return text_override.strip()

        fn = file_name.lower()
        if fn.endswith(".pdf"):
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pages = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(pages).strip()
            except Exception as e:
                return file_bytes.decode("utf-8", errors="ignore")
        elif fn.endswith(".docx"):
            try:
                import zipfile
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
                    xml_content = docx.read('word/document.xml')
                    tree = ET.fromstring(xml_content)
                    paragraphs = []
                    for elem in tree.iter():
                        if elem.tag.endswith('}p'):
                            text_runs = [t.text for t in elem.iter() if t.tag.endswith('}t') and t.text]
                            p_text = "".join(text_runs).strip()
                            if p_text:
                                paragraphs.append(p_text)
                    return "\n".join(paragraphs).strip()
            except Exception:
                return file_bytes.decode("utf-8", errors="ignore")
        else:
            return file_bytes.decode("utf-8", errors="ignore")

    def analyze_resume(self, file_name: str, file_bytes: bytes, 
                       text_override: Optional[str] = None, 
                       target_role: str = "Full Stack / Software Engineer") -> Dict[str, Any]:
        """Performs comprehensive ATS scoring and skill gap analysis."""
        raw_text = self.extract_text(file_name, file_bytes, text_override)
        if not raw_text or len(raw_text.strip()) < 50:
            return {
                "success": False,
                "error": "The uploaded resume contains insufficient or unreadable text. Please upload a valid PDF, DOCX, or TXT document."
            }

        text_lower = raw_text.lower()
        words = re.findall(r'\b[a-z0-9+#.-]+\b', text_lower)
        word_count = len(words)

        # 1. Essential Section Header Detection
        sections_found = {}
        section_weights = {
            "education": 15,
            "skills": 20,
            "projects": 25,
            "experience": 15,
            "contact": 10
        }
        
        section_patterns = {
            "education": [r'\beducation\b', r'\bacademics\b', r'\bdegree\b', r'\buniversity\b'],
            "skills": [r'\bskills\b', r'\btechnical skills\b', r'\btechnologies\b', r'\bcompetencies\b'],
            "projects": [r'\bprojects\b', r'\bpersonal projects\b', r'\bacademic projects\b'],
            "experience": [r'\bexperience\b', r'\binternship\b', r'\bwork history\b', r'\bemployment\b'],
            "contact": [r'\bemail\b', r'\bphone\b', r'\blinkedin\b', r'\bgithub\b', r'\b@\b']
        }

        section_score = 0
        for sec, patterns in section_patterns.items():
            matched = any(re.search(pat, text_lower) for pat in patterns)
            sections_found[sec] = matched
            if matched:
                section_score += section_weights[sec]

        # 2. Contact Information Presence
        has_email = bool(re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', raw_text))
        has_phone = bool(re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text))
        has_github = "github.com" in text_lower or "github" in text_lower
        has_linkedin = "linkedin.com" in text_lower or "linkedin" in text_lower

        # 3. Action Verb & Impact Quantification Check
        verbs_found = [v for v in self.action_verbs if re.search(rf'\b{v}\b', text_lower)]
        quantifiable_metrics = len(re.findall(r'\b\d+(?:%|\+|k|x|ms|s|lpa|gb|mb)?\b', text_lower))
        metric_score = min(15, quantifiable_metrics * 2)

        # 4. Skill Extraction & Tier Mapping
        found_tier1 = [s for s in self.tier1_skills if re.search(rf'\b{re.escape(s)}\b', text_lower)]
        found_tier2 = [s for s in self.tier2_skills if re.search(rf'\b{re.escape(s)}\b', text_lower)]
        found_tier3 = [s for s in self.tier3_skills if re.search(rf'\b{re.escape(s)}\b', text_lower)]

        all_found_skills = sorted(list(set(found_tier1 + found_tier2 + found_tier3)))
        
        # Skill Score (up to 30 points)
        skill_score = min(30, (len(found_tier1) * 3) + (len(found_tier2) * 2) + len(found_tier3))

        # 5. Length & Formatting Score (10 points)
        length_score = 10 if 200 <= word_count <= 800 else (5 if 100 <= word_count < 200 or word_count > 800 else 2)

        # Total ATS Score Calculation
        raw_ats = section_score + metric_score + skill_score + length_score
        ats_score = min(98, max(28, int(raw_ats * 0.95)))

        # 6. Placement Tier Affinity Determination
        tier1_ratio = len(found_tier1) / max(1, len(self.tier1_skills))
        tier2_ratio = len(found_tier2) / max(1, len(self.tier2_skills))

        if len(found_tier1) >= 4 and len(all_found_skills) >= 8:
            matched_tier = "Tier 1: Product & Dream Companies"
            target_companies = ["Zoho", "Amazon", "Freshworks", "Cisco", "Thoughtworks"]
            readiness_verdict = "Strong candidacy for high-package product engineering profiles. Your technical stack exhibits systems-level breadth."
            tier_badge = "Product Ready"
            tier_color = "emerald"
        elif len(found_tier2) >= 3 or len(all_found_skills) >= 5:
            matched_tier = "Tier 2: Technology Specialists"
            target_companies = ["Thoughtworks", "Hexaware", "Virtusa", "L&T Technology"]
            readiness_verdict = "Well-suited for core application engineering & full-stack development roles. Add depth in algorithms and system scale to target Tier 1."
            tier_badge = "Specialist Ready"
            tier_color = "blue"
        else:
            matched_tier = "Tier 3: IT Services & Mass Recruiters"
            target_companies = ["TCS Digital", "Infosys", "Cognizant", "Wipro", "Accenture"]
            readiness_verdict = "Solid foundational profile for campus drives. Supplement with at least 2 full-stack projects and cloud fundamentals."
            tier_badge = "Foundational"
            tier_color = "purple"

        # 7. Identify Missing High-Priority Keywords
        missing_tier1 = [s for s in sorted(list(self.tier1_skills)) if s not in text_lower][:6]
        missing_tier2 = [s for s in sorted(list(self.tier2_skills)) if s not in text_lower][:4]

        # 8. Actionable Recommendations
        recommendations = []
        if not sections_found.get("projects"):
            recommendations.append("Add a dedicated **'Key Technical Projects'** section showcasing live deployment URLs or GitHub repositories.")
        if not sections_found.get("experience"):
            recommendations.append("Include an **'Internships / Academic Experience'** heading to highlight collaborative software teamwork.")
        if metric_score < 8:
            recommendations.append("Quantify project impact with numbers (e.g. *'Reduced query latency by 35%'*, *'Handled 500+ daily requests'*).")
        if not has_github:
            recommendations.append("Include your **GitHub profile link** at the top contact header to verify your coding commits.")
        if not has_linkedin:
            recommendations.append("Add your **LinkedIn URL** to demonstrate professional networking.")
        if len(found_tier1) < 3:
            recommendations.append(f"Incorporate cloud and distributed systems keywords such as **{', '.join(missing_tier1[:3])}**.")

        if not recommendations:
            recommendations.append("Resume is strongly optimized for campus placements. Tailor project descriptions to specific job role keywords.")

        return {
            "success": True,
            "file_name": file_name,
            "word_count": word_count,
            "ats_score": ats_score,
            "ats_rating": "Excellent" if ats_score >= 80 else ("Good" if ats_score >= 65 else "Needs Enhancement"),
            "section_audit": sections_found,
            "contact_audit": {
                "has_email": has_email,
                "has_phone": has_phone,
                "has_github": has_github,
                "has_linkedin": has_linkedin
            },
            "skills_found": all_found_skills,
            "skills_count": len(all_found_skills),
            "tier_match": {
                "tier_name": matched_tier,
                "badge": tier_badge,
                "color": tier_color,
                "target_companies": target_companies,
                "verdict": readiness_verdict
            },
            "missing_keywords": {
                "tier1_product": missing_tier1,
                "tier2_specialist": missing_tier2
            },
            "action_verbs_used": sorted(list(set(verbs_found))),
            "recommendations": recommendations
        }
