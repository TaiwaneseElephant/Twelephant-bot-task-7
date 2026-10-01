async function search(query_string, headers, cookies) {
	let offset = 0;
	while (true) {
	    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=0&srprop=&srlimit=max&srsearch=${encodeURIComponent(query_string)}&assert=user&formatversion=2&format=json`, {
	        headers: headers
	    });
	    if (!response.ok) {
	        throw new Error(response.status);
	    }
	    const data = await response.json();
	    if (data.error) {
	        throw new Error(data.error.code);
	    }
	    let pagelist = [];
	    for (let page of data.query.search) {
	        pagelist.push(page.pageid);
	    }
		headers, cookies = setHeaders(response, ncookies);
		if (!data.continue) {
			return result, headers, cookies;		
		}
	}
  }

function setHeaders(response, cookies) {
    let headers =  {"User-Agent": "Twelephant-bot", "Content-Type": "application/x-www-form-urlencoded"};
    for (const [key, value] of Object.entries(getCookies(response))) {
        cookies[key] = value;
    }
    Cookieslist = [];
    for (const [key, value] of Object.entries(cookies)) {
        Cookieslist.push(`${key}=${value}`);
    }
    headers.Cookie = Cookieslist.join("; ")
}
    return [headers, cookies];
}

function getCookies(response) {
    let cookies = {};
    for (let cookie of response.headers.getSetCookie()) {
        const split = cookie.split(";")[0].split("=", 2);
        cookies[split[0].trim()] = split[1].trim();
    }
    return cookies;
}

async function getConfig() {
    const response = await fetch("https://zh.wikipedia.org/w/index.php?title=User:Twelephant-bot/task/7/config.json&action=raw&ctype=application/json", {
        headers: {"User-Agent": "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const config = await response.json();
    const [headers, cookies] = setHeaders(response, {});
    return [config, headers, cookies];
}

async function getToken(type, headers, cookies) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&meta=tokens&type=${type}&formatversion=2&format=json`, {
        headers: headers
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    const token = data.query.tokens[`${type}token`];
    [headers, cookies] = setHeaders(response, cookies);
    return [token, headers, cookies];
}

async function login(name, pwd, headers, cookies) {
    let [logintoken, newheaders, newcookies] = await getToken("login", headers, cookies);
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=login&formatversion=2&format=json`, {
        method: "POST",
        headers: newheaders,
        body: new URLSearchParams({lgname: name, lgpassword: pwd, lgtoken: logintoken}).toString()
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    if (!data.login || data.login.result != "Success") {
        throw new Error("Login Failed");
    }
    return setHeaders(response, newcookies);
}

async function edit(page, content, summary, headers, cookies) {
    let token = (await getToken("csrf", headers, cookies))[0];
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=edit&assert=user&formatversion=2&format=json`, {
        method: "POST",
        headers: headers,
        body: new URLSearchParams({title: page, text: content, summary: summary, minor: true, bot: true, token: token}).toString()
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    if (data.error) {
        console.log(data.error.code);
    }
	return setHeaders(response, newcookies);
}

function ChangeClass(element, table) {
    const classtext = element.match(/class\s*=\s*?["']?((?:[\w\d\- ](?!=))+)["' ]/);
    if (classtext === null) {
        classes = new Set();
	}
	else{
        return element;
	}
    if (table !== null) {
		for (let [key, value] of Object.entries(table)) {
        	if (classes.has(key)) {
				classes.union(new Set(value));
				classes.delete(key);
			}
		}
	}
	let newclasstext = "";
    if (classes.size > 0) {
        newclasstext = ` class="${Array.from(classes).join(" ")}"`;
	}
    let newelement = element.replace(/ *class\s*=\s*["']?((?:[\w\d\- ](?!=))+)["' ]/, newclasstext);
    if (newelement == element && classes.size > 0)
        newelement = element + newclasstext;
    return newelement.trimEnd();
}

function pageprocess(page, table, template, ignore_tags = null) {
    let content = await fetch(`https://zh.wikipedia.org/w/api.php?action=query, `);
    let temp = [];
    if (ignore_tags !== null) {
        content = content.replaceAll("&#x2060;", "")
        const remove_ignore_tags = function (match) {
            temp.push(match);
            return `&#x2060;${temp.length}&#x2060;`;
		};
        content = content.replaceAll(new RegExp(`<(${ignore_tags})(?: [^>\\n/]*)?>[\\s\\S]*?</\\1 *>`, "ig"), remove_ignore_tags);
	}
    content = content.replaceAll(/((?:^|\n)\s*\{\| *)(.*=.*)/ig, ((match, p1, p2) => `${template}${p1}${ChangeClass(p2.trim(), table)}`))
    if (ignore_tags !== null) {
        for (let i = 0; i < temp.length; i++) {
            content = content.replace(`&#x2060;${i + 1}&#x2060;`, temp[i]);
		}
	}
    return await edit(page, content, summary, headers, cookies);
}

async function main() {
    let [config, headers, cookies] = await getConfig();
    if (!config.Enable) {
        console.log("Stop");
        return;
    }
    const query_string = config.query_string;
    const template = config.header;
	const table = config.table;
    const summary = config.summary;
    const { readFile } = require("node:fs/promises");
    const secret = JSON.parse(await readFile("password.json"));
    [headers, cookies] = await login(secret.ACCOUNT, secret.BOTPWD, headers, cookies);
    const pagelist = await search(query_string, headers);
	let index = 0;
    setInterval()
    await edit(page, content, summary, headers, cookies);
}
