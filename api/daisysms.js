export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') { return res.status(200).end(); }

    const DAISYSMS_API_KEY = "oOnFtoeCBzJidw9ebwBO4ZovdtwPJr";

    if (req.method === 'GET') {
        const action = req.query.action || 'getNumber';
        const service = req.query.service || ''; 
        const id = req.query.id; 
        const status = req.query.status;

        try {
            let url = `https://daisysms.com/stubs/handler_api.php?api_key=${DAISYSMS_API_KEY}&action=${action}`;
            if (service) url += `&service=${service}`;
            if (id) url += `&id=${id}`;
            if (status) url += `&status=${status}`;

            const response = await fetch(url);
            const text = await response.text();

            if (action === 'getNumber') {
                if (text.startsWith("ACCESS_NUMBER")) {
                    const parts = text.split(":");
                    return res.status(200).json({ success: true, orderId: parts[1], phone: parts[2] });
                } else {
                    return res.status(200).json({ success: false, message: text });
                }
            } 
            else if (action === 'getStatus') {
                if (text.startsWith("STATUS_OK")) {
                    const parts = text.split(":");
                    return res.status(200).json({ success: true, status: "OK", code: parts[1] });
                } else {
                    return res.status(200).json({ success: true, status: text });
                }
            }
            else if (action === 'setStatus') {
                return res.status(200).json({ success: true, status: text });
            }
            else if (action === 'getPrices') {
                try {
                    const json = JSON.parse(text);
                    return res.status(200).json({ success: true, data: json });
                } catch(e) {
                    return res.status(200).json({ success: false, data: text });
                }
            }
            return res.status(200).json({ success: true, data: text });
        } catch (error) {
            return res.status(500).json({ success: false, message: "API Error" });
        }
    }
    return res.status(405).json({ message: "Method Not Allowed" });
}
