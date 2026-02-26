// Pseudo-random number generator for deterministic data
function seedRandom(seed) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const rand = seedRandom(42);

const companies = [
  "Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant",
  "IBM", "Oracle", "SAP", "Dell", "Amazon", "Flipkart", "Swiggy",
  "Razorpay", "PhonePe", "Paytm", "Zoho", "Freshworks", "Juspay", "CRED"
];
const roles = [
  "SDE Intern", "Graduate Engineer Trainee", "Junior Backend Developer",
  "Frontend Intern", "QA Intern", "Data Analyst Intern",
  "Java Developer", "Python Developer", "React Developer",
  "Full Stack Engineer", "DevOps Engineer", "Cloud Architect"
];
const locations = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Gurgaon", "Noida", "Remote"];
const modes = ["Remote", "Hybrid", "Onsite"];
const experiences = ["Fresher", "0-1", "1-3", "3-5"];
const sources = ["LinkedIn", "Naukri", "Indeed"];
const skillsPool = ["React", "Node.js", "Python", "Java", "AWS", "SQL", "MongoDB", "Docker", "Kubernetes", "TypeScript", "Git", "Figma", "Excel", "Data Analysis"];

function getRandomItem(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function getRandomSkills() {
  const count = Math.floor(rand() * 4) + 2; // 2 to 5 skills
  const selected = new Set();
  while (selected.size < count) {
    selected.add(getRandomItem(skillsPool));
  }
  return Array.from(selected);
}

function generateDescription(role, company, mode, exp) {
  const adjs = ["innovative", "fast-paced", "dynamic", "growing", "industry-leading"];
  const adj = getRandomItem(adjs);
  return `Join our ${adj} team at ${company} as a ${role}. 
We are looking for passionate individuals with ${exp} experience to build scalable solutions. 
This is a ${mode} role. You will collaborate with cross-functional teams to deliver high-quality software. 
Apply now to be part of our exciting journey.`;
}

function generateSalary(exp) {
  if (exp === "Fresher") return getRandomItem(["₹15k–₹25k/month Internship", "₹20k–₹40k/month Internship", "3–5 LPA", "4–6 LPA"]);
  if (exp === "0-1") return getRandomItem(["4–6 LPA", "5–8 LPA", "6–10 LPA"]);
  if (exp === "1-3") return getRandomItem(["6–10 LPA", "8–12 LPA", "10–15 LPA"]);
  if (exp === "3-5") return getRandomItem(["10–18 LPA", "15–25 LPA", "20–30 LPA"]);
  return "Not Disclosed";
}

const jobsData = [];

for (let i = 1; i <= 60; i++) {
  const company = getRandomItem(companies);
  const role = getRandomItem(roles);
  const mode = getRandomItem(modes);
  const experience = getRandomItem(experiences);
  const location = mode === "Remote" ? "India" : getRandomItem(locations);

  jobsData.push({
    id: `JOB-${1000 + i}`,
    title: role,
    company: company,
    location: location,
    mode: mode,
    experience: experience,
    skills: getRandomSkills(),
    source: getRandomItem(sources),
    postedDaysAgo: Math.floor(rand() * 11), // 0 to 10
    salaryRange: generateSalary(experience),
    applyUrl: `https://example.com/apply/${1000 + i}`,
    description: generateDescription(role, company, mode, experience)
  });
}

window.jobsData = jobsData;
