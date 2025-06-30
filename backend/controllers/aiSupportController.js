import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have GEMINI_API_KEY in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getAISupport = async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
        const prompt = `You are a friendly and helpful assistant for an LMS platform called EduFlex. Answer the following question from a course creator concisely and helpfully. If you don't know the answer, politely suggest they create a support ticket. Question: "${message}"`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("AI SUPPORT ERROR:", error);
        res.status(500).json({ message: "Sorry, I couldn't get a response from the AI assistant at the moment." });
    }
};