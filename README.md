# :pushpin: 영화 OTT 플랫폼 서비스



## 1. 제작 기간 & 참여 인원
- 2023년 2월 1일 ~ 3월 7일
- 4명



## 2. 사용 기술
#### `Back-end`
  - Node.js 18.13.0v
  - npm 8.19.3v
  - Express 4.18.2v
  - MongoDB 5.0.0
#### `Front-end`
  - HTML
  - CSS
- javaScript ES6


## 3. 내 역할과 업무성과
- 비디오 스트리밍 기능, 북마크 기능, 별점 기능, 댓글 구현 
- 형상관리 담당

## 4. 구현 기능 핵심 코드 

<details>
<summary><b>구현 기능 설명 펼치기</b></summary>
<div markdown="1">

### 4.1. 전체 흐름

![mvc](https://github.com/WonJae0914/secondProject/blob/main/portflio/img/MVC%EC%A0%84%EC%B2%B4%ED%9D%90%EB%A6%84.png)

### 4.2. 비디오 스트리밍 기능(미완성)

<details>
<summary> <b>Router</b> </summary>

```javascript
//get
browseRouter.get("/video", videos);
```

</details>

<details>
<summary> <b>Controller&Model</b> </summary>

```javascript
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
```
</details>


### 4.3. 북마크 기능
<details>
<summary><b>Router</b></summary>

```javascript
//get
browseRouter.get("/bookmark/:id",isLoggedIn ,video); // 북마크 
//post
browseRouter.post("/bookmark", isLoggedIn ,addbookmark, delBookmark); // 북마크 

```
</details>

<details>
<summary><b>Controller&Model</b></summary>

```javascript
// 북마크 생성 함수 
const addbookmark = async (req, res, next) =>{
  // 요청 받은 컨텐츠 타이틀 데이터
  const {title} = req.query;
  // 접속한 유저 정보 가져오기
  const arrayBookmark = await User.findOne({id : req.user.id });
  // 접속한 유저에 요청 받은 컨텐츠 타이틀 저장
  try{
    if(arrayBookmark.bookmark.includes(title)==false){ // 유저 DB에 요청받은 타이틀 DB가 있는지 확인
        await User.findOneAndUpdate(
          { id : req.user.id },
          { $addToSet : {bookmark: title} },
          { returnOriginal: false }
        );
        res.status(200).json({ message: "북마크가 추가되었습니다." });
        return res.end();
      } else {
        next();
      };
    }catch{
        return res.status(500).json({ error: "북마크 추가 에러" });
      };
       
  };
  
// 북마크 제거 함수
const delBookmark = async (req, res) =>{
  // 요청 받은 컨텐츠 타이틀 데이터
  const {title} = req.query;
  // 접속한 유저 정보 가져오기
  const arrayBookmark = await User.findOne({id : req.user.id });
  // 접속한 유저에 요청 받은 컨텐츠 타이틀 삭제
    try{
      await User.findOneAndUpdate(
        { id : req.user.id },
        { $pull : {bookmark: title} },
        { returnOriginal: false }
      );
       res.status(200).json({ message: "북마크가 삭제되었습니다." });
    }
    catch{
       res.status(500).json({ error: "북마크 삭제 에러" });
    };
  };
```

</details>

<details>
<summary><b>javaScript</b></summary>

```javascript
// 북마크 참조 요소
const bookmark = document.querySelector(".rating-bookmark");
const title = document.querySelector("#movie").dataset.title;
const icon = document.querySelector(".fa-bookmark");
const bookmarkData = document.querySelector("#data1").dataset.bookmark;

// 북마크 비동기 함수 
function bookmarkHandler(){
    $.ajax({
      method : "post",
      url : "/bookmark?title="+title,
      data : { title : title },
      dataType : "json",
      success : function(res){
        if(res!==null){
          icon.classList.toggle("fa-solid");
        };
      },
    });
  };
// 북마크 클릭 이벤트 
bookmark.addEventListener("click", bookmarkHandler);
```

</details>



### 4.4. 별점 기능

<details>
<summary><b>Router</b></summary>

```javascript
browseRouter.post("/score", isLoggedIn, starScore); // 별점 
```

</details>

<details>
<summary><b>Controller&Model</b></summary>

```javascript
// 별점 생성
const addScore = async function(req,res){
    try {
    const id = req.user.id;
    const { userScore } = req.body;
    const { userTitle } = req.body;   
    await db.collection("contentScore").insertOne(
        { userId : req.user.id,
            title : userTitle,
            score : parseInt(userScore) })
    return res.json({msg : "success"})
    } catch (error) {
        res.status(400).json({message : "false"})
    }
}

 // 해당 컨텐츠의 컨텐츠스코어 DB정보 가져오기
  const result2 = await db.collection("contentScore").find({
    userId : userId
  }).toArray();

  const result3 = await db.collection("contentScore").find({
    title : result.제목
  }).toArray();

  // 해당 컨텐츠에 유저가 평가한 점수 가져오기
  function userScore(){
    for(const us of result2){
      if(us.title==result.제목){
        return us.score
      }
    }
   }

  // 유저의 컨텐츠점수 카운트
  const contentCnt = await db.collection("contentScore")
                  .countDocuments({title: result.제목, score: {"$exists": true}})
  
  // 별점 평균 내기
  const scoreAvg = function() {
    let sumScore = 0;
    let notNum = 0;
    let avg = 0;
    for(let i=0; i<contentCnt; i++){
      sumScore += result3[i].score;
    }
    avg = Math.ceil(sumScore/contentCnt);
    return isNaN(avg) ? notNum : avg
  }

```
</details>

<details>
<summary><b>javasScript</b></summary>

```javascript
const stars = document.querySelectorAll(".star");
const subStarbtn = document.querySelector(".subStar");
const userTitle = document.querySelector("#movie").dataset.title;
let rating=-1;

document.addEventListener('DOMContentLoaded', function(){
  const userScore = document.querySelector("#userScore").dataset.userscore;
   
    stars.forEach(function (star) { // star = class명 star인 모든 span
      // 클릭한 별 이하의 모든 별에 대해
     if (star.getAttribute("data-rating") <= userScore) {
       // 선택된 별 스타일을 적용
       star.classList.add("selected");
     } else {
       // 선택되지 않은 별 스타일을 제거
       star.classList.remove("selected");
     }
   });
});

if(subStarbtn){
// 각 별 요소에 클릭이벤트 부여
stars.forEach(function (star) {
  star.addEventListener("click", setRating);
});
  function setRating(e) {
    // 클릭한 별의 요소를 가져옴
    const clickedStar = e.target;
    //클릭한 별 요소의 등급을 가져옴. 해당 요소의 지정한 값을 가져옴
    rating = clickedStar.getAttribute("data-rating");
    // 모든 별 요소에 대해 반복
    stars.forEach(function (star) { // star = class명 star인 모든 span
       // 클릭한 별 이하의 모든 별에 대해
      if (star.getAttribute("data-rating") <= rating) {
        // 선택된 별 스타일을 적용
        star.classList.add("selected");
      } else {
        // 선택되지 않은 별 스타일을 제거
        star.classList.remove("selected");
      }
    });
  }
  subStarbtn.addEventListener("click", function(){
    alert("평가하시겠습니까?")
    $.ajax({
      method : "post",
      url : "/score?score=" + rating,
      data : { userScore : rating,
               userTitle : userTitle },
      success : function(){
        subStarbtn.style.display="none"
        stars.addEventListener("click",(e)=>{
          e.preventDefault();
        })
      } 
    })
  })
}
```

</details>

### 4.5. 댓글 기능

<details>
<summary><b>Router</b></summary>

```javascript
//post
browseRouter.post("/watch/:id", isLoggedIn, review);
```

</details>

<details>
<summary><b>Controller&Model</b></summary>

```javascript
// 리뷰 DB에 저장하기
const review = async(req,res) => {
    const id = parseInt(req.params.id);
    const { review } = req.body;
    console.log(id)
    console.log(review)
    try {
        await db.collection('post').updateOne(
            {_id : id}, 
            { $addToSet : {review : review}})
        return res.redirect(`/watch/${id}`)
    } catch (error) {
        console.error(error);
    }
}

  // 리뷰 생성
  const review = result.review ? result.review : "";

  res.render("watch", { 
    posts : result,
    title : userInfo.bookmark,
    score : userScore(),
    avg : scoreAvg(),
    cnt : cnt,
    review : review
  })

  // 리뷰 개수 조회
  const cnt = result.review ? result.review.length : 0;

```
</details>
</div>
</details>

</br>

## 5. 프로젝트 진행하며 어려웠던 점 

### 5.1. **비디오 스트리밍 방법에 대한 문제**
- 처음 개발 시 DB에 저장된 비디오 경로를 HTML <video> 태그안에 직접 호출하여 비디오가 재생될 수 있도록 처리 
- 데이터가 큰 비디오 파일을 불러올 시 한번에 데이터를 다 불러온 다음 실행되기 때문에 클라이언트, 서버 모두 데이터 처리 비용 소모가 큼

#### 해결방법
- fs(file system)모듈을 활용한 stream 을 사용하여 해결 시도 
- 해당 모듈을 사용하여 stream을 할 경우 데이터를 모듈화하여 보내기 때문에 클라이언트, 서버 모두 데이터 처리 효율 향상 기대
- [코드확인](#4-구현-기능-핵심-코드)

#### 결과 
- 결과적으로 시간부족으로 문제를 해결하지 못하고 프로젝트가 종료 됨. 

#### 원인 
- 프로젝트 기간 내 Node.js를 학습하며 프로젝트 진행하여 시간 부족. 
- 스스로 해결하려고 고집을 부려 시간 허비.

#### 결론
- 현재 수강생의 입장이기에 학습을 위해 고집을 부렸지만 실제 서비스를 제공해야 한다면 수단과 방법을 가리지 않고 먼저 기능을 구현해야 된다는 것을 생각하게 되었습니다.
- 그리고 데이터가 큰 파일들을 처리할 때 단순히 파일을 읽어 전송하게 되면 서버 메모리에 과부하가 와서 서버가 다운될 수 있어 stream이란 데이터 컬렉션을 통해 큰 파일을 처리할 수 있다는 것을 알게 되었습니다. 
- 다음 프로젝트 진행 시 구현 할 기능들에 대해 기한을 정하고 구현해가면서 당장에 할 수 있는 것과 어려운 것을 구분하여 강사님, 동료의 도움을 받아 문제 해결을 우선 순위로 하고 그 다음 학습할 수 있도록 하여 어떻게 해서든 맡은 업무를 완성할 수 있도록 해야겠다는 생각을 했습니다.

</div>
</details>

</br>


