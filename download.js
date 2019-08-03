const cheerio = require('cheerio');
const http = require('https');
const fs = require('fs');

var domain = '';
var downloadFolder = '';
var links = [];
var startIndex = 0;

/**
 * Tries to download the page for the link specified
 * 
 * @param {string} link 
 * @param {function} callback 
 */
let processLink = function (link, callback) {


    let req = http.request(link,
        (res) => {
            let output = '';
            if (res.headers["content-type"].indexOf('audio/mpeg') >= 0) {
                let disposition = res.headers['content-disposition'];
                let name = '';
                if (disposition && disposition.indexOf('filename') > 0) {
                    name = disposition.split('"')[1];
                } else {
                    let pices = link.split('/');
                    name = pices[pices.length - 1];
                }
                let file = fs.createWriteStream(downloadFolder + '/' + name);

                showInformation('Downloading file: <b>' + name + '</b>');

                res.pipe(file);
                res.on('end', () => {
                    file.close();
                    showInformation('Completed downloading file: <b>' + name + '</b>');
                    if (typeof callback == 'function') {
                        callback();
                    }
                })
            } else if (res.headers["content-type"].indexOf('text/html') >= 0) {

                showInformation('Parsing web page for more links: ' + link);
                res.on('data', (d) => {
                    output += d;
                });

                res.on('end', () => {
                    let $ = cheerio.load(output);

                    $('a').toArray().reverse().forEach(function (link) {
                        var url = $(link).attr('href');
                        if (url && url.indexOf(domain) != -1 && links.indexOf(url) == -1 && links.length > 0) {
                            links.push(url);
                        }
                    });
                    showInformation('Parsing web page completed: ' + link);

                    if (typeof callback == 'function') {
                        callback();
                    }
                });
            } else {
                if (typeof callback == 'function') {
                        callback();
                }
            }
        }
    );

    req.end();
}

/**
 * Processes the next link in the array
 * 
 */
function doNextLink() {
    startIndex += 1;
    if (links[startIndex] != undefined) {
        
        let sleepTime = getRandomInt(5000);
        showInformation('Pausing for: ' + parseInt((sleepTime / 1000), 10)+ ' seconds');
        setTimeout(()=>{
            showInformation('Starting next link: ' + links[startIndex]);
            processLink(links[startIndex], doNextLink);
        },sleepTime);
        
    } else {
        showInformation('Download completed');
    }

}

/**
 * Processing starts here
 * 
 * This function is called from the UI
 * 
 * @param {string} link 
 * @param {string} downloadPath 
 */
function download(link, downloadPath) {
    if (!domain) {
        domain = link.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
    }

    downloadFolder = downloadPath;
    links = [link];

    processLink(link, doNextLink);
}

/**
 * Displays information to the user
 * 
 * @param {string} info 
 */
function showInformation(info) {
    try {
        document.getElementById('message').innerHTML = '<p>' + info + '</p>';
    } catch (e) {
        console.info(info);
    }

}

/**
 * Stops the current processing
 */
function stopDownload()
{
    links = [];
}

/**
 * Helper function
 * 
 * @return numeric
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
