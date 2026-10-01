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

function pageprocess(text, table, header ignore_tags = null) {
    let content = text;
    let temp = [];
    if (ignore_tags !== null) {
        content = content.replaceAll("&#x2060;", "")
        const remove_ignore_tags = function (match) {
            temp.push(match);
            return `&#x2060;${temp.length}&#x2060;`;
		};
        content = content.replaceAll(new RegExp(`<(${ignore_tags})(?: [^>\\n/]*)?>[\\s\\S]*?</\\1 *>`, "ig"), remove_ignore_tags);
	}
    content = content.replaceAll(/((?:^|\n)\s*\{\| *)(.*=.*)/ig, ((match, p1, p2) => `${header}${p1}${ChangeClass(p2.trim(), table)}`))
    if (ignore_tags !== null) {
        for (let i = 0; i < temp.length; i++) {
            content = content.replace(`&#x2060;${i + 1}&#x2060;`, temp[i]);
		}
	}
    return content;
}
