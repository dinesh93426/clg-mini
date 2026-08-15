import apiClient, { DEMO_MODE, simulateNetworkDelay } from './api';
import { MOCK_EVENTS } from './mockData';

export const aiService = {
  sendMessageToAssistant: async (chatMessages, studentProfile = null) => {
    await simulateNetworkDelay(1200); // AI responses take slightly longer

    if (DEMO_MODE) {
      const userMessage = chatMessages[chatMessages.length - 1].text.toLowerCase();
      let reply = "";
      let sources = [];
      let suggestions = [];

      if (userMessage.includes("technical") || userMessage.includes("workshop") || userMessage.includes("technology")) {
        const matchingEvents = MOCK_EVENTS.filter(e => e.category === 'Technology' || e.category === 'AI');
        reply = `Based on the current database, there are **${matchingEvents.length} technical workshops and events** scheduled. Since your profile indicates a strong interest in technology and AI, you have high matches for: \n\n` + 
          matchingEvents.map(e => `* **${e.title}** (${e.date}) at ${e.venue}. AI Match: **${e.aiMatchPercentage}%**`).join('\n') +
          `\n\nWould you like me to register you for any of these, or do you want more details?`;
        
        sources = matchingEvents.map(e => ({ id: e.id, title: e.title }));
        suggestions = ["How many seats are available?", "Who is organizing the hackathon?", "Register me for the AI Workshop"];
      } 
      else if (userMessage.includes("tomorrow") || userMessage.includes("happen")) {
        reply = "There are no events scheduled for tomorrow, but we have **Indie Rock and Fusion Night** scheduled on **August 25th** and the **Smart Campus Hackathon** starting **August 28th**. Both are highly recommended by the campus student activity algorithms.";
        sources = [
          MOCK_EVENTS.find(e => e.id === "event-05"),
          MOCK_EVENTS.find(e => e.id === "event-02")
        ].filter(Boolean);
        suggestions = ["Who is organizing the hackathon?", "Are there seats available for Indie Rock?"];
      }
      else if (userMessage.includes("seats") || userMessage.includes("available")) {
        const eventsWithSeats = MOCK_EVENTS.map(e => `* **${e.title}**: ${e.availableSeats} seats left (out of ${e.totalSeats})`).join('\n');
        reply = `Here is the current seating availability for active events on campus:\n\n${eventsWithSeats}\n\nNote that the **React 19 & Next.js Showcase** is completely **sold out** (0 seats left).`;
        sources = MOCK_EVENTS.slice(0, 3);
        suggestions = ["Can you suggest another React event?", "Register me for the DSA bootcamp"];
      }
      else if (userMessage.includes("hackathon") || userMessage.includes("organizer")) {
        const hackathon = MOCK_EVENTS.find(e => e.id === "event-02");
        reply = `The **${hackathon.title}** is organized by the **${hackathon.organizer}**. It's a 36-hour challenge taking place at the **${hackathon.venue}** starting **August 28th**. Over 105 students have registered. The platform predicts it will reach capacity within 4 days.`;
        sources = [hackathon];
        suggestions = ["How many seats are available?", "Are there prerequisites to join?", "What are the rules?"];
      }
      else if (userMessage.includes("register")) {
        reply = "I've checked the requirements. To register, please head over to the **Explore Events** tab, click **View Details** on the event card, and click the 'Register Now' button. This ensures your seat allocation and calendar sync are finalized correctly.";
        suggestions = ["Go to events list", "What other workshops match my profile?"];
      }
      else {
        reply = "Hello! I am your Campus Event Intelligence Assistant. I can help you find events, recommend workshops based on your profile, track registrations, and answer capacity questions.\n\nTry asking me: *'What events are happening this week?'* or *'Are there seats left in the React workshop?'*";
        suggestions = ["What events are happening tomorrow?", "Which workshops match my interests?", "How many seats are available?"];
      }

      return {
        role: "ai",
        text: reply,
        sources,
        suggestions,
        timestamp: new Date().toISOString()
      };
    }

    const response = await apiClient.post('/ai/assistant', { messages: chatMessages, studentProfile });
    return response.data;
  },

  generateEventIdea: async (promptText) => {
    await simulateNetworkDelay(1800); // AI generation takes longer

    if (DEMO_MODE) {
      const pr = promptText.toLowerCase();
      let title = "AI & Prompt Engineering Bootcamp";
      let category = "AI";
      let description = "Unlock the power of artificial intelligence in this intensive hands-on bootcamp. Learn prompt engineering, basic API integrations, and practical AI application development.";
      let targetAudience = "Second-year and Third-year CSE and ECE students interested in software automation and intelligent models.";
      let objectives = "1. Understand LLM concepts and transformer models.\n2. Master prompt patterns (Few-shot, Chain-of-Thought).\n3. Build a functional AI assistant in Python/React.";
      let agenda = "09:00 - Introduction & LLM Foundations\n10:30 - Tea Break\n10:45 - Hands-on: Building prompts & API calls\n13:00 - Lunch Break\n14:00 - Team Coding Sprint: AI Prototypes\n16:30 - Showcases & Closing Notes";
      let requirements = "Basic programming knowledge in Python or JavaScript. Bring your laptop with Node.js and Python 3.9+ installed.";
      let suggestedDuration = "1 Day (8 Hours)";

      if (pr.includes("generative ai") || pr.includes("generative")) {
        title = "Generative AI Hack-Sprint for CSE";
        category = "AI";
        description = "Collaborative sprint focused on building user experiences powered by generative models like GPT-4, Gemini, and Stable Diffusion. Build, deploy, and showcase.";
      } else if (pr.includes("react") || pr.includes("frontend") || pr.includes("next")) {
        title = "Modern Frontend Bootcamp with Next.js";
        category = "Technology";
        description = "Learn how to build high-performance, responsive React applications using Next.js. Cover server actions, rendering models, and Tailwind styling.";
        targetAudience = "All students interested in web development and full-stack engineering.";
        requirements = "Familiarity with basic HTML, CSS, and JavaScript. Active GitHub account.";
        suggestedDuration = "2 Days (12 Hours total)";
      } else if (pr.includes("business") || pr.includes("entrepreneur") || pr.includes("pitch")) {
        title = "Business Design Sprint: Zero to MVP";
        category = "Business";
        description = "An interactive training event to formulate business hypotheses, map customer journeys, and design high-fidelity landing pages or UI mockups for pitching.";
        targetAudience = "Open to all disciplines: Engineering, MBA, and Design students.";
        objectives = "1. Validate a startup idea.\n2. Create a functional pitch deck.\n3. Present to campus advisors.";
        suggestedDuration = "4 Hours";
      }

      return {
        title,
        category,
        description,
        targetAudience,
        objectives,
        agenda,
        requirements,
        suggestedDuration,
        tags: [category, "AI Generated", "Bootcamp"]
      };
    }

    const response = await apiClient.post('/ai/generator', { prompt: promptText });
    return response.data;
  }
};
