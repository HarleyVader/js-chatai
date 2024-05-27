const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Level } = require('level');
const fs = require('fs');

const app = express();
const PORT = 6969;

//using an anonimous function will asign the constant globaly
const excludedir = ["assets"];
const filter = (value) => {
    if (excludedir.includes(value)) {
        return false; 
    }
    //change dir to get the video dir list (change for VPS)
    if (fs.statSync(path.resolve("./views") + '/' + value).isDirectory()) {
        return true
    }
    return false
}
//fs get dir list by filtering then joining & resolving the path for the fs to read the dir sync
let dirlist = fs.readdirSync(path.resolve("../counter/views")).filter(filter);
// Create a database
const db = new Level('vidViews', { valueEncoding: 'json' })
db.open()
//copilot with try catch error handling
async function addVidTodb() {
    try {
        for (let value of dirlist) {
            if (!await db.get(value, () => false)) {
                await db.put(value, 0)
            }
        }
    } catch (error) {
        console.error('Error in addVidTodb:', error);
    }
}
//total video views from all videos
async function calculateTotalViews() {
    let totalViews = 0;
    for await (const [key, value] of db.iterator({})) {
        totalViews += value;
    }
    return totalViews;
}
app.set("view engine", "ejs");
// Middleware to parse JSON in the request body
app.use(bodyParser.json());
// Serve static files from the 'public' directory
//console.log(app.use(express.static(path.join(__dirname, 'counter'))));
app.use(express.static(path.join(__dirname, 'public')));
//console.log(__dirname)

app.get('/videos/sync', async (req, res) => {
    await addVidTodb();
    console.log("Sync Complete!", __dirname);
    return res.redirect('/videos/list');
})
app.get("/videos/list", async (req, res) => {
    let list = [];
    for await (const [key, value] of db.iterator({})) {
        list.push({ key, value });
    }
    res.render(path.resolve('../counter/list/index.ejs'), {list, totalViews:await calculateTotalViews()});
    console.log("/videos listed");
});
app.get('/videos/:videoId', async (req, res) => {
    const { videoId } = req.params;
    let videoviews = await db.get(videoId).catch(err => {console.log(err); return; } );
    console.log(videoId, videoviews)
    if (videoviews !== undefined) {   
        videoviews += 1;    
        await db.put(videoId, videoviews); 
        console.log(`Video ${videoId} play count incremented. Total plays: ${videoviews}`);
        // Send the updated view count back to the client
        res.render(path.resolve(`../counter/views/${videoId}/index.ejs`), {viewCount: videoviews});
        console.log(`${videoId}`);
    } else {
        res.status(400).json({ success: false, error: 'Missing videoId in the request body' });
    }
});
app.get('/videos', function(req, res) {
    res.render(path.resolve('../counter/views/index.ejs'));
});
app.listen(PORT, '185.235.177.160')

const debug = function () {
    console.log(dirlist);    
    //console.log(viewCount);
    //console.log(videoviews);
    //console.log(filter);
    //console.log(videoviews);
    //process.exit(); //forcefull prosses exit
    //console.log(() => { })
    //() => { } //anonimous function 
}
debug();
