// A pool of ~100 popular topics (world trends + exam themes + everyday life +
// business) used to pick a RANDOM topic when the user leaves the topic blank.
// Topics are English phrases since they feed English-content generation.

export const TOPIC_POOL: string[] = [
  // World / trending / exam
  "Climate change",
  "Artificial intelligence",
  "Renewable energy",
  "Space exploration",
  "Globalization",
  "Social media",
  "Cybersecurity",
  "Online privacy",
  "Fake news and misinformation",
  "Electric vehicles",
  "Plastic pollution",
  "Mental health",
  "Public health",
  "Vaccines",
  "Urbanization",
  "Deforestation",
  "Water scarcity",
  "Automation and the future of work",
  "Aging populations",
  "Gender equality",
  "Income inequality",
  "Cultural diversity",
  "Endangered species",
  "Sustainable fashion",
  "Food security",
  "Smart cities",
  "Digital currency",
  "Virtual reality",
  "Robotics",
  "Biotechnology",
  "Genetic engineering",
  "Renewable vs fossil fuels",
  "Education technology",
  "Distance learning",
  "Lifelong learning",
  "Standardized testing",
  "Studying abroad",
  "The gig economy",
  "Tourism and the environment",
  "Overpopulation",
  // Everyday life
  "Daily routines",
  "Hobbies and interests",
  "Family relationships",
  "Friendship",
  "Healthy eating",
  "Exercise and fitness",
  "Travel and tourism",
  "Cooking and recipes",
  "Pets and animals",
  "Weather and seasons",
  "Shopping habits",
  "Music and concerts",
  "Movies and cinema",
  "Books and reading",
  "Sports",
  "Festivals and holidays",
  "Fashion and style",
  "Photography",
  "Gardening",
  "Video games",
  "Coffee culture",
  "Public transport",
  "City life vs countryside",
  "Weekend activities",
  "Childhood memories",
  "Learning a new language",
  "Time management",
  "Sleep and rest",
  "Volunteering",
  "Social etiquette",
  "Online shopping",
  "Streaming and entertainment",
  "Houses and homes",
  "Neighbourhoods",
  "Transport and traffic",
  "Personal goals",
  "Dreams and ambitions",
  "Memorable trips",
  "Favourite places",
  "Everyday technology",
  // Business / office
  "Job interviews",
  "Writing a resume",
  "Career development",
  "Remote work",
  "Teamwork",
  "Leadership",
  "Marketing strategies",
  "Startups",
  "Entrepreneurship",
  "Customer service",
  "Work-life balance",
  "Office communication",
  "Writing business emails",
  "Negotiation",
  "Personal finance",
  "Investing",
  "Budgeting and saving",
  "Productivity",
  "Professional networking",
  "Brand building",
  "E-commerce",
  "Advertising",
  "Project management",
  "Workplace culture",
  "Public speaking",
  // Science / technology (mở rộng)
  "Quantum computing",
  "Nanotechnology",
  "3D printing",
  "Drones",
  "Self-driving cars",
  "The metaverse",
  "Cryptocurrency regulation",
  "Facial recognition",
  "Wearable technology",
  "Cloud computing",
  "The Internet of Things",
  "5G networks",
  "Machine learning",
  "Augmented reality",
  "Space tourism",
  "Mars colonization",
  "Satellite technology",
  "Green technology",
  "Battery technology",
  "Artificial intelligence in the workplace",
  // Environment (mở rộng)
  "Ocean acidification",
  "Coral reef bleaching",
  "Air pollution",
  "Recycling",
  "Composting",
  "Wildlife conservation",
  "National parks",
  "Reforestation",
  "Carbon footprint",
  "Zero-waste living",
  "Soil degradation",
  "Natural disasters",
  "Extreme weather",
  "Sustainable agriculture",
  "Vertical farming",
  "Ecotourism",
  "Renewable water resources",
  // Health & wellbeing (mở rộng)
  "Nutrition and diet",
  "Obesity",
  "Fast food culture",
  "Meditation and mindfulness",
  "Yoga",
  "Stress management",
  "Work burnout",
  "Screen time and health",
  "Digital detox",
  "Preventive healthcare",
  "Telemedicine",
  "Alternative medicine",
  "Sleep disorders",
  "Fitness apps",
  "Ageing and longevity",
  // Society & culture (mở rộng)
  "Multiculturalism",
  "Immigration",
  "Human rights",
  "Freedom of speech",
  "Social justice",
  "Poverty reduction",
  "Homelessness",
  "Access to education",
  "The digital divide",
  "Online communities",
  "Influencer culture",
  "Cancel culture",
  "Generational differences",
  "Consumerism",
  "Minimalism",
  "Traditional vs modern values",
  "Language preservation",
  "Cultural heritage",
  "Museums and galleries",
  "Street art",
  "Pop culture",
  // Education & self-development (mở rộng)
  "Creative writing",
  "Learning musical instruments",
  "Art education",
  "Critical thinking",
  "Problem-solving skills",
  "Emotional intelligence",
  "Bilingual education",
  "Homeschooling",
  "Online courses",
  "Gamification in learning",
  "Study techniques",
  "Exam stress",
  "Building good habits",
  "Personal branding",
  // Everyday life (mở rộng)
  "Morning routines",
  "Decluttering",
  "Home organization",
  "Digital nomads",
  "Side hustles",
  "Freelancing",
  "Frugal living",
  "Second-hand fashion",
  "Local cuisine",
  "Food waste",
  "Urban gardening",
  "Camping and hiking",
  "Road trips",
  "Solo travel",
  "Board games",
  "Learning to cook",
  // Business & economy (mở rộng)
  "Corporate social responsibility",
  "Business ethics",
  "Global supply chains",
  "Global trade",
  "Small businesses",
  "Franchising",
  "Crowdfunding",
  "Venture capital",
  "Digital marketing",
  "Content creation",
  "Social media marketing",
  "Influencer marketing",
  "Customer loyalty",
  "Workplace diversity",
  "Employee wellbeing",
  "Flexible working hours",
  "The four-day work week",
];

/** Random topic from the pool, optionally avoiding one value (e.g. the last). */
export function randomTopic(avoid?: string): string {
  const pool = avoid ? TOPIC_POOL.filter((t) => t !== avoid) : TOPIC_POOL;
  const i = Math.floor(Math.random() * pool.length);
  return pool[i] ?? TOPIC_POOL[0];
}

// Xoay vòng chủ đề cho Essay: dùng hết các chủ đề CHƯA dùng rồi mới lặp lại.
// Lưu danh sách đã dùng trong localStorage (chỉ áp dụng khi để trống chủ đề).
const ESSAY_USED_KEY = "engzone:essay:usedTopics:v1";

function readUsed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(localStorage.getItem(ESSAY_USED_KEY) || "[]");
    // Chỉ giữ chủ đề còn tồn tại trong pool (pool có thể đổi giữa các phiên bản).
    return Array.isArray(list) ? list.filter((t: string) => TOPIC_POOL.includes(t)) : [];
  } catch {
    return [];
  }
}

function writeUsed(list: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ESSAY_USED_KEY, JSON.stringify(list));
  }
}

/**
 * Chủ đề Essay tiếp theo: chọn ngẫu nhiên trong các chủ đề CHƯA dùng ở vòng này;
 * khi đã dùng hết → reset và bắt đầu vòng mới. Đánh dấu chủ đề vừa chọn là đã dùng.
 */
export function nextEssayTopic(): string {
  let used = readUsed();
  let remaining = TOPIC_POOL.filter((t) => !used.includes(t));
  if (remaining.length === 0) {
    // Hết một vòng → xoay lại từ đầu.
    used = [];
    remaining = [...TOPIC_POOL];
  }
  const pick = remaining[Math.floor(Math.random() * remaining.length)] ?? TOPIC_POOL[0];
  writeUsed([...used, pick]);
  return pick;
}
