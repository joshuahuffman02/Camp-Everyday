// Absolute minimal Vercel function - no dependencies
module.exports = (req, res) => {
    res.status(200).json({
        ok: true,
        message: 'Hello from Vercel!',
        time: new Date().toISOString()
    });
};
