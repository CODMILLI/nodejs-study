var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHTML = require("sanitize-html");

var app = http.createServer(function(request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;

  // page 존재 유무 식별
  if (pathname === "/") {
    // main page 식별
    if (queryData.id === undefined) {
      // ./data 위치 dir을 읽어서 원소를 filelist에 배열 형식으로 저장
      fs.readdir("./data", function(err, filelist) {
        var title = "Welcome";
        var description = "Hello, Node.js";
        var list = template.list(filelist);
        var html = template.html(
          title,
          list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir("./data", function(err, filelist) {
        var filterdId = path.parse(queryData.id).base;
        fs.readFile(`data/${filterdId}`, "utf8", function(err, description) {
          var title = queryData.id;
          var sanitizedTitle = sanitizeHTML(title);
          var sanitizedDescription = sanitizeHTML(description, {
            allowedTags: ["h1"]
          });
          var list = template.list(filelist);
          var html = template.html(
            sanitizedTitle,
            list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            `
            <a href="/create">create</a>
            <a href="/update?id=${sanitizedTitle}">update</a>
            <form action = "delete_process" method = "post">
                <input type = "hidden" name = "id" value = "${sanitizedTitle}">
                <input type = "submit" value = "delete">
            </form>
            `
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if (pathname === "/create") {
    fs.readdir("./data", function(err, filelist) {
      var title = "WEB - create";
      var list = template.list(filelist);
      var html = template.html(
        title,
        list,
        `
        <form action = "/create_process" method = "post">
            <p><input type = "text" name = "title" placeholder = "title"></p>
            <p>
                <textarea name = "description" placeholder = "description"></textarea>
            </p>
            <p>
                <input type = "submit">
            </p>
        </form>
        `,
        ""
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/create_process") {
    // post 방식으로 전송된 data를 get하는 event
    var body = "";
    request.on("data", function(data) {
      body = body + data;
    });
    request.on("end", function() {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, "utf8", function(err) {
        response.writeHead(302, { Location: `/?id=${title}` }); // 302: 리다이렉션
        response.end("success");
      });
    });
  } else if (pathname === "/update") {
    fs.readdir("./data", function(err, filelist) {
      var filterdId = path.parse(queryData.id).base;
      fs.readFile(`data/${filterdId}`, "utf8", function(err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.html(
          title,
          list,
          `
          <form action = "/update_process" method = "post">
            <input type = "hidden" name = "id" value = ${title}>
            <p><input type = "text" name = "title" placeholder = "title" value = "${title}"></p>
            <p>
                <textarea name = "description" placeholder = "description">${description}</textarea>
            </p>
            <p>
                <input type = "submit">
            </p>
          </form>
          `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === "/update_process") {
    var body = "";
    request.on("data", function(data) {
      body = body + data;
    });
    request.on("end", function() {
      var post = qs.parse(body);
      var title = post.title;
      var id = post.id;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function(error) {
        fs.writeFile(`data/${title}`, description, "utf8", function(err) {
          response.writeHead(302, { Location: `/?id=${title}` }); // 302: 리다이렉션
          response.end("success");
        });
      });
    });
  } else if (pathname === "/delete_process") {
    var body = "";
    request.on("data", function(data) {
      body = body + data;
    });
    request.on("end", function() {
      var post = qs.parse(body);
      var id = post.id;
      var filterdId = path.parse(id).base;
      fs.unlink(`data/${filterdId}`, function(error) {
        response.writeHead(302, { Location: "/" });
        response.end("success");
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
