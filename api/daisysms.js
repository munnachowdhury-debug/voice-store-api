// api/daisysms.js
export default async function handler(req, res) {
    // CORS সেটিংস (যেন আপনার ওয়েবসাইট থেকে এটি কল করা যায়)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // আপনার DaisySMS API Key
    const DAISYSMS_API_KEY = "oOnFtoeCBzJidw9ebwBO4ZovdtwPJr";

    // ১. Webhook: DaisySMS থেকে যখন OTP বা SMS আসবে
    if (req.method === 'POST') {
        try {
            const data = req.body;
            console.log("OTP Received from DaisySMS:", data);
            
            // পরবর্তীতে এখানে Firebase Database এ OTP সেভ করার কোড দেব।
            
            return res.status(200).send("OK");
        } catch (error) {
            return res.status(500).json({ error: "Webhook processing error" });
        }
    }

    // ২. Get Number: আপনার ওয়েবসাইট থেকে যখন কাস্টমার নাম্বার কিনতে চাইবে
    if (req.method === 'GET') {
        // 'go' মানে গুগল ভয়েস।
        const service = req.query.service || 'go'; 
        
        try {
            const response = await fetch(`https://daisysms.com/stubs/handler_api.php?api_key=${DAISYSMS_API_KEY}&action=getNumber&service=${service}`);
            const text = await response.text();

            // যদি নাম্বার সফলভাবে কেনা যায়
            if (text.startsWith("ACCESS_NUMBER")) {
                const parts = text.split(":");
                return res.status(200).json({ 
                    success: true, 
                    orderId: parts[1], 
                    phone: parts[2] 
                });
            } else {
                // যদি ব্যালেন্স না থাকে বা স্টক না থাকে
                return res.status(200).json({ success: false, message: text });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
    
    return res.status(405).json({ message: "Method Not Allowed" });
}
