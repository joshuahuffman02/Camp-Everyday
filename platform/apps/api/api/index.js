// Vercel Serverless Function - Simple test to verify function execution works
// Once this works, we'll add NestJS back

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    try {
        // Check what files exist in the dist folder
        const distPath = path.join(__dirname, '..', 'dist');
        let distFiles = [];

        try {
            distFiles = fs.readdirSync(distPath);
        } catch (e) {
            distFiles = ['ERROR: ' + e.message];
        }

        res.status(200).json({
            success: true,
            message: 'Vercel function is working!',
            path: req.url,
            method: req.method,
            dirname: __dirname,
            cwd: process.cwd(),
            distPath: distPath,
            distFiles: distFiles,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                hasDbUrl: !!process.env.DATABASE_URL,
                hasPlatformDbUrl: !!process.env.PLATFORM_DATABASE_URL
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
};
