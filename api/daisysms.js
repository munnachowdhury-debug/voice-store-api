export default async function handler(req, res) {
    // CORS সেটিংস (যাতে আপনার ওয়েবসাইট থেকে কল করা যায়)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') { 
        return res.status(200).end(); 
    }

    // আপনার DaisySMS API Key (আমি বসিয়ে দিয়েছি)
    const DAISYSMS_API_KEY = "oOnFtoeCBzJidw9ebwBO4ZovdtwPJr";

    if (req.method === 'GET') {
        const action = req.query.action || 'getNumber';
        const service = req.query.service || 'go'; // 'go' মানে গুগল ভয়েস
        const id = req.query.id; // OTP চেক করার জন্য Order ID

        try {
            let url = `https://daisysms.com/stubs/handler_api.php?api_key=${DAISYSMS_API_KEY}&action=${action}`;
            if (action === 'getNumber') url += `&service=${service}`;
            if (action === 'getStatus' && id) url += `&id=${id}`;

            const response = await fetch(url);
            const text = await response.text();

            // নাম্বার কেনার রিকোয়েস্ট হলে
            if (action === 'getNumber') {
                if (text.startsWith("ACCESS_NUMBER")) {
                    const parts = text.split(":");
                    return res.status(200).json({ success: true, orderId: parts[1], phone: parts[2] });
                } else {
                    return res.status(200).json({ success: false, message: text });
                }
            } 
            // OTP চেক করার রিকোয়েস্ট হলে
            else if (action === 'getStatus') {
                if (text.startsWith("STATUS_OK")) {
                    const parts = text.split(":");
                    return res.status(200).json({ success: true, status: "OK", code: parts[1] });
                } else {
                    return res.status(200).json({ success: true, status: text });
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "API Error" });
        }
    }
    return res.status(405).json({ message: "Method Not Allowed" });
}
