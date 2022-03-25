'use strict'

const express = require('express');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const Mux = require('@mux/mux-node');


let dot_Path = '';
try {
    if (fs.existsSync('/run/secrets/env')) {
        dot_Path = path.resolve('/run/secrets/env');
    } else {
        dot_Path = path.resolve('.env');
    }
} catch {
    dot_Path = path.resolve('.env');
}
dotenv.config({path: dot_Path});


const app = express();
const {Video} = new Mux();
const PORT = process.env.PORT || 8080;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.redirect('/assets');
});

async function strapi_get(){
    try {
        const resp = await axios('http://strapi:1337/assets');
        console.log(resp.data);
        return resp.data; 
    } catch (err) {
        console.error(err.stack);
        try {
            const resp = await axios('http://localhost:1337/assets');
            console.log(resp.data);
            return resp.data;
        } catch (err) {
            console.error(err.stack);
            return Array(err.stack);
        }
    }
};

async function strapi_post(asset_id, playback_id, title, desc, upload_id="No-Id"){
    try {
        const resp = await axios.post('http://strapi:1337/assets', {
            asset_id: asset_id,
            playback_id: playback_id,
            title: title,
            description: desc,
            upload_id: upload_id
        });
        console.log(resp.data);
        return resp.data;

    } catch (err) {
        console.error(err.stack);
        try {
            const resp = await axios.post('http://localhost:1337/assets', {
                asset_id: asset_id,
                playback_id: playback_id,
                title: title,
                description: desc,
                upload_id: upload_id
            });
            console.log(resp.data);
            return resp.data;
        } catch (err) {
            console.error(err.stack);
            return Array(err.stack);
        }
    }
};

async function strapi_put(asset_id, upload_id="None", playback_id="None", title="None", desc="None"){

    let data = {
        asset_id: asset_id,
        playback_id: playback_id,
        title: title,
        description: desc
    };

    data.playback_id == "None" ? delete data.playback_id : {};
    data.title == "None" ? delete data.title : {};
    data.description == "None" ? delete data.description : {};

    try {

        const resp = await axios.get(`http://strapi:1337/assets?upload_id=${upload_id}`);
        const entry = resp.data[0].upload_id ? resp.data[0].id : null
        console.log("Strapi Entry id: "+String(entry));

        const resp2 = await axios.put(`http://strapi:1337/assets/${entry}`, data);
        console.log(resp2.data);

        return resp2.data;

    } catch (err) {
        console.error(err.stack);
        try {
            const resp = await axios.get(`http://localhost:1337/assets?upload_id=${upload_id}`);
            const entry = resp.data[0].upload_id ? resp.data[0].id : null
            console.log("Strapi Entry id: "+String(entry));
    
            const resp2 = await axios.put(`http://localhost:1337/assets/${entry}`, data);
            console.log(resp2.data);
            return resp2.data;
        } catch (err) {
            console.error(err.stack);
            return Array(err.stack);
        }
    }
};


function fill_asset(data, asset_id){
    try {
        let asset_stg = ``;
        let match = false;

        data.some(
            entry => {
                let entryJS = JSON.parse(JSON.stringify(entry));
                let br = `<br>`;

                if (entryJS.asset_id == asset_id && !match) {
                    match = true
                    let index = `<small>${entryJS.id}</small>`;
                    let title = `<small><strong>${entryJS.title}</strong></small>`;
                    let date = `<small><i>${entryJS.updated_at.split('.')[0].split('T')[0]}</i></small>`;
                    let desc = `<caption><i>${entryJS.description}</i></caption>`;

                    let vid = `<video id="video" height="360" width="640" controls></video>`;
                    let vid_script = `<script>
                                        var video = document.getElementById('video');
                                        var src = 'https://stream.mux.com/${entryJS.playback_id}.m3u8';
                                        if (Hls.isSupported()) {
                                            var hls = new Hls();
                                            hls.loadSource(src);
                                            hls.attachMedia(video);
                                        }
                                        else if (video.canPlayType('application/vnd.apple.mpegurl')) {video.src = src;}
            
                                        mux.monitor(video, {
                                            debug: true,
                                            hlsjs: hls,
                                            Hls: Hls,
                                            data: {
                                                env_key: '${process.env.MUX_ENV_KEY}',
                                                player_name: 'hls.js',
                                                player_init_time: window.muxPlayerInitTime,
                                                video_id: '${entryJS.id}', 
                                                video_title: "${entryJS.title}"
                                                //single quotes breaks on apostrophe titles
                                                //since concat html strings in js, need static
                                            }
                                        });
                                        video.play();
                                    </script>`;

                    asset_stg = asset_stg.concat(index + br +
                        title + br +
                        date + br +
                        vid + br +
                        desc + br +
                        br + br +
                        vid_script);
                    }
                }
            ); 
        return asset_stg;
    } catch (err) {
        console.error(err.stack);
        return `<p>
                    <details>
                    <summary>Error filling</summary>
                    <pre>${err.stack}</pre>
                    </details>
                </p>`
    }
};

function fill_entries_img(data){
    try {
        let ent_stg = ``;

        data.forEach(
            entry => {
                let entryJS = JSON.parse(JSON.stringify(entry));
                let br = `<br>`;
                let div1 = `<div style="float:left; margin:15px">`;
                let div2 = `</div>`;

                let index = `<small>${entryJS.id}</small>`;
                let title = `<small><strong>${entryJS.title}</strong></small>`;
                let date = `<small><i>${entryJS.updated_at.split('.')[0].split('T')[0]}</i></small>`;

                let img = `<a href="/assets?id=${entryJS.asset_id}">
                                <img src="https://image.mux.com/${entryJS.playback_id}/thumbnail.png?width=314&height=178&fit_mode=pad"
                                alt="${entryJS.title}" width="314" height="178">
                            </a>`;
                
                let desc = `<caption><i>${entryJS.description}</i></caption>`;

                ent_stg = ent_stg.concat(div1 + index + br +
                                        title + br +
                                        date + br +
                                        img + br +
                                        desc + br +
                                        br + br + div2);
                }
            );

        return ent_stg;

    } catch (err) {
        console.error(err.stack);
        return `<p>
                    <details>
                    <summary>Error filling</summary>
                    <pre>${err.stack}</pre>
                    </details>
                </p>`
    }

};

app.post('/url', async (req, res) => {
   
    try {
    const asset = await Video.Assets.create({input: req.body.url, playback_policy: 'public'});

    const pb_id = asset.playback_ids ? asset.playback_ids[0].id : "None";
    const title = req.body.title.isEmpty ? "No Title" : req.body.title;
    const desc = req.body.desc.isEmpty ? "No Desc" : req.body.desc;
    const status = asset.id ? await strapi_post(asset.id, pb_id, title, desc) : "Create Failed";

    res.redirect(`/assets?status=${JSON.stringify(status)}`);
    } catch (err) {
            console.error(err.stack);
            res.send(Array(err.stack));
    }
});

app.get('/remote', async (req, res) => {
    res.send(
        `<html>
        <title>Create from Remote</title>
        <body>
            <a href = "/assets" style="float:left; margin:5px">Home</a>
            
            <a href = "/local" style="float:left; margin:5px">Create from Local</a>
            <br><br>
            <p><strong>Create from Remote</strong></p>
            <br>
            <form action="/url" method="POST">
            <label>*URL: </label>
            <input type="url" id="url" name="url" placeholder="https://muxed.s3.amazonaws.com/leds.mp4"
            pattern="(https:\/\/.*)|(http:\/\/.*)" size="60" title="Needs http(s)://" required>
            <br><br>
            <label>*Title: </label>
            <input type="text" id="title" name="title" placeholder="Led's" size="45" required>
            <br><br>
            <label>Description: </label>
            <input type="text" id="desc" name="desc" placeholder="Wall of lights vid" size="60">
            <br><br>
            <input type="submit">
            </form>
            <br>
            `+`${Object.getOwnPropertyNames(req.query).toString()}`+`
        </body>
    </html>`
    );
});


app.get('/local', async (req, res) => {
    res.send(
        `<html>
        <title>Create from Local</title>
        <body>
            <a href = "/assets" style="float:left; margin:5px">Home</a>
            
            <a href = "/remote" style="float:left; margin:5px">Create from Remote</a>
            <br><br>
            <p><strong>Create from Local</strong></p>
            <br>
            <label>*File: </label>
            <input type="file" id="file" accept="video/*,audio/*">
            <br><br>
            <label>*Title: </label>
            <input type="text" id="title" placeholder="Content Pt2" size="45">
            <br><br>
            <label>Description: </label>
            <input type="text" id="desc" placeholder="Latest edit" size="60">
            <br><br>
            <input type="button" id="btn" value="Submit">
            <div id="err" style="display:none; color:red">
            <p>Need to select a local file & add title</p>
            </div>
            <br><br><br><br>
            <div id="pgdiv" style="display:none">
            <label id="pglbl" for="prog">Upload Progress:</label>
            <br><br>
            <progress id="prog" value="0" max="100"></progress>
            </div>
            <script src="https://unpkg.com/@mux/upchunk@2"></script>
            <script>

                document.getElementById("btn").onclick = async () => {
                    if (document.getElementById("file").files.length == 0 || document.getElementById("title").value.length == 0){
                        console.log("Need to select a local file & add title");
                        document.getElementById("err").style.display = "block";
                    } else {
                        document.getElementById("err").style.display = "none";
                        await new_local();
                    }
                };

                let prog = document.getElementById("prog");
                let pgdiv = document.getElementById("pgdiv");
                let pglbl = document.getElementById("pglbl");

                let upload_id = "";

                async function url(data){
                const resp = await fetch('/direct', {
                    method: 'POST', 
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                        }
                    });
                    const JS = await resp.json();
                    upload_id = JS.upload;
                    console.log("Create Status: "+JS.create_status);
                return JS.url;
                };

                function use_upchunk(up_url, file){
                    return new Promise((resolve, reject) => {
                        const upload = UpChunk.createUpload({
                            endpoint: up_url,
                            file: file.files[0],
                            chunkSize: 5120
                        });
                    
                        upload.on('error', err => {
                            console.error('💥 🙀', err.detail);
                            reject(err.detail);
                        });
                    
                        upload.on('progress', progress => {
                            console.log(\`So far we've uploaded \${progress.detail}% of this file.\`);
                            prog.value = Number(progress.detail);
                            pglbl.innerHTML = \`Upload Progress: \${Math.round(progress.detail)}%\`;
                        });
                    
                        upload.on('success', () => {
                            console.log("Wrap it up, we're done here. 👋");
                            resolve(up_url);
                        });
                    
                    });


                };


                async function new_local(){
                    let file = document.getElementById("file");
                    let title = document.getElementById("title").value;
                    let desc = document.getElementById("desc").value;
                    let data = {title: title, desc: desc};

                    pgdiv.style.display = "block";

                    try{
                        await use_upchunk(String(await url(data)), file);
                        await update(upload_id);
                        window.location.href = '/assets';
                    } catch (err) {
                        console.error(err);
                    }
                };

                async function update(up_id){
                    let data = {upload: up_id};
                    const resp = await fetch('/assets', {
                        method: 'PUT', 
                        body: JSON.stringify(data),
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    return resp.text();
                };
            </script>
            `+`${Object.getOwnPropertyNames(req.query).toString()}`+`
        </body>
    </html>`
    );
});

app.post('/direct', async (req, res) => {

    try {
        const upload = await Video.Uploads.create({cors_origin: '*', new_asset_settings: {playback_policy: 'public'}});

        const a_id = "None"; const pb_id = "None";

        const title = req.body.title.isEmpty ? "No Title" : req.body.title;
        const desc = req.body.isEmpty ? "No Desc" : req.body.desc;
        const status = upload.id ? await strapi_post(a_id, pb_id, title, desc, upload.id) : "Create Failed";

        res.send({url: upload.url, upload: upload.id, create_status: JSON.stringify(status)});
        
    } catch (err) {
        console.error(err.stack);
        res.send(Array(err.stack));
    }

});

app.get('/assets', async (req, res) => {
    if (req.query.id) {
        res.send(
            `<html>
                <title>Asset: ${req.query.id}</title>
                <body>
                    <script>window.muxPlayerInitTime = Date.now();</script>
                    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
                    <script src="https://src.litix.io/core/4/mux.js"></script>
                    <a href = "/assets" style="float:left; margin:5px">Home</a>
                    <br><br>
                    <p><strong>Asset: ${req.query.id}</strong></p>
                    
                    `+`${fill_asset(await strapi_get(), req.query.id)}`+`
                </body>
            </html>`
        );
    } else {
        res.send(
            `<html>
                <title>assets</title>
                <body>
                    <a href = "/assets" style="float:left; margin:5px">Home</a>
                    
                    <a href = "/remote" style="float:left; margin:5px">Create</a>
                    <br><br>
                    <p><strong>Assets from Strapi  -  Mux Video & Data </strong></p>
                    
                    `+`${fill_entries_img(await strapi_get())}`+`
                </body>
            </html>`
        );
    }
});

app.put('/assets', async (req, res) => {

    if (req.body.upload) {

        let updatedUpload = await Video.Uploads.get(req.body.upload);
        let asset = await Video.Assets.get(updatedUpload.asset_id);
        let pb_id = asset.playback_ids[0].id;

        await strapi_put(asset.id, req.body.upload, pb_id);

        res.send("Successful Update");
    } else {
        res.send("Error: expecting upload id in body or asset id in url");
    }
});

app.listen(PORT, () => console.log(`Node.js running on http://localhost:${PORT}/assets`));
