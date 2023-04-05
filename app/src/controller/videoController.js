"use strict"

// fs모듈 불러오기 
const fs = require("fs");
//path 모듈 불러오기
const path = require("path");

// DB 연결을 위한 몽고클러이언트 불러오기 
const MongoClient = require('mongodb-legacy').MongoClient;
// DB 모듈을 사용하기 위한 변수 선언
let db;
// DB와 Node 연결
MongoClient.connect("mongodb+srv://kdKim:6r7r6e5!KD@cluster0.mo9rckf.mongodb.net/?retryWrites=true&w=majority"
    , { useNewUrlParser: true },
    function (err, client) {
        if (err) { return console.log('DB연결 실패'); }
        db = client.db('test');
    });

// 동영상 파일 경로 생성 함수
const getVideoPath = (id) => {
    return `videos/${id}.mp4`;
  };
  
  // 동영상 스트리밍을 처리하는 핸들러 함수
  const videos = async function (req, res) {
    try {
      const id = parseInt(req.params.id);
      const { range } = req.headers;
  
      // id가 숫자가 아닐 경우 400 오류 반환
      if (isNaN(id)) {
        return res.status(400).send("Invalid ID");
      }
  
      // 동영상 파일 경로 생성
      const videoPath = getVideoPath(id);
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const CHUNK_SIZE = 10 ** 6; // 1MB
  
      // range 헤더에서 시작 지점(start) 추출
      const start = Number(range.replace(/\D/g, ""));
  
      // range 헤더에서 끝 지점(end) 추출하거나 파일 크기 - 1 지점으로 설정
      const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
  
      // 요청한 범위가 파일 크기를 넘어설 경우 416 오류 반환
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).send("Requested Range Not Satisfiable");
      }
  
      // 응답 헤더 설정
      const contentLength = end - start + 1;
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, headers);
  
      // 동영상 파일 읽기 스트림 생성
      const videoStream = fs.createReadStream(videoPath, { start, end });
  
      // 파일 읽기 스트림에서 에러 발생 시 500 오류 반환
      videoStream.on("error", (err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  
      // 파일 읽기 스트림과 응답 스트림을 연결하여 동영상 스트리밍 반환
      videoStream.pipe(res);
    } catch (err) {
      // 예기치 않은 에러 발생 시 500 오류 반환
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  };

module.exports = videos;