'use strict'

const rp = require('request-promise');
               // whatever the iOS server's IP is
var baseUrl = 'http://75.85.140.22:8080/api/v1/';
var soundfile,
    activeSession = false;
var options = {
  uri     : baseUrl,
  json    : true,
  qs      : { SessionToken : '' },
  headers : { 'User-Agent' : 'Request-Promise' }
};

// initialize session on srv
function init() {
  return rp(options.uri + 'init_session')
    .then( (body)=> {
      options.qs.SessionToken = JSON.parse(body).SessionToken;
      activeSession = true;
      console.log('Session opened: ' + options.qs.SessionToken);
      // 10sec window to spam blips
      setTimeout( ()=> { delete_session() }, 10000);
    });
}

// find ID of first speaker (1 of 1) in list
function device_listing() {
  options.uri = baseUrl + 'device_list';
  return rp(options)
    .then( (body)=> {
      options.qs.DeviceID = body.DeviceList[0].DeviceID;
    });
}

// add speaker to current session
function add_device_to_session() {
  options.uri = baseUrl + 'add_device_to_session';
  return rp(options);

}

// find ID of first media item (1 of 1) in list
function media_listing() {
  options.uri = baseUrl + 'media_list';
  return rp(options)
    .then( (body)=> {
      body = body.MediaList.filter( function(medias) {
        return medias.Title == soundfile;
      });
      options.qs.PersistentID = body[0].PersistentID;
    })
}

// play the audio on the speaker
function play_hub_media() {
  options.uri = baseUrl + 'play_hub_media';
  return rp(options)
    .then( (body)=> {
      console.log('Audio played: ' + soundfile)
    });
}

// session exit
function delete_session() {
  options.uri = baseUrl + 'close_session';
  return rp(options)
    .then( ()=> {
      activeSession = false;
      console.log('Session closed: ' + options.qs.SessionToken);
    });
}

// go go go
function play(input) {
  soundfile = input;

  if(activeSession == true) {
    return media_listing()
      .then(play_hub_media);

  } else {
    return init()
            .then( device_listing)
            .then( add_device_to_session)
            .then( media_listing)
            .then( play_hub_media);
  }
}

module.exports = {
  device_listing        : device_listing,
  add_device_to_session : add_device_to_session,
  media_listing         : media_listing,
  play_hub_media        : play_hub_media,
  delete_session        : delete_session,
  init                  : init,
  play                  : play
}

