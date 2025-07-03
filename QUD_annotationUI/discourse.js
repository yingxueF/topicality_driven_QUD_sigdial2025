$ = function (name) {
    return document.getElementById(name);
};

function removeChildren(elem) {
    while (elem.firstChild)
        elem.removeChild(elem.firstChild);
}

function elementIndex(elem) {
	if (elem.parentNode == null)
		return -1;
	return [...elem.parentNode.children].indexOf(elem);
}


var moved;
var lines;
var text_id;

function fill_form(id, sents) {
	text_id = id;
	$('title').innerText = id;
	root = $('discourse');
	removeChildren(root);
	moved = -1;
	lines = [];
	for (let i = 0; i < sents.length; i++)
		append_pair_line(i, sents[i]);
	document.addEventListener('mouseup', (e) => { stop_all_drag(); });
}

function append_pair_line(index, sent) {
	const pair = document.createElement('div');
	pair.className = 'pair';
	const entry = document.createElement('textarea');
	entry.rows = 1;
	const givenText = document.createElement('div');
	givenText.className = 'text';
	givenText.innerText = sent;
	pair.appendChild(entry);
	pair.appendChild(givenText);
	make_line(index, pair, entry, lines.length, false, 0);
}

function add_singleton_line(i, level) {
    const single = document.createElement('div');
    single.className = 'singleton';
    const entry = document.createElement('textarea');
    entry.rows = 1;
    single.appendChild(entry);
    make_line(-1, single, entry, i, true, level);
}

function make_line(index, content, entry, i, singleton, level) {
	const main = document.createElement('div');
	main.className = 'line';
	for (let i = 0; i < level; i++)
		main.appendChild(indentation(i));
	const handle = document.createElement('div');
	handle.className = 'handle';
	const left = document.createElement('div');
	left.className = 'left hidden';
	handle.appendChild(left);
	const right = document.createElement('div');
	right.className = 'right hidden';
	handle.appendChild(right);
	const up = document.createElement('div');
	up.className = 'up hidden';
	handle.appendChild(up);
	const down = document.createElement('div');
	down.className = 'down hidden';
	handle.appendChild(down);
	handle.addEventListener('mousedown', (e) => { start_drag(main); });
	left.addEventListener('mouseenter', (e) => { enter_left(main); });
	right.addEventListener('mouseenter', (e) => { enter_right(main); });
	up.addEventListener('mouseenter', (e) => { enter_up(main); });
	down.addEventListener('mouseenter', (e) => { enter_down(main); });
	entry.addEventListener('keyup', (e) => { check_entry(main); });
	main.appendChild(handle);
	main.appendChild(content);
	const next = i < lines.length ? lines[i].main : null;
	$("discourse").insertBefore(main, next);
	const record = { index, singleton, level, main, entry, handle, left, right, up, down };
	lines.splice(i, 0, record);
}

function remove_line(i) {
	$('discourse').removeChild(lines[i].main);
	lines.splice(i, 1);
}


function start_drag(main) {
	const i = elementIndex(main);
	moved = i;
	set_targets(i);
}

function stop_all_drag() {
	for (let i = 0; i < lines.length; i++)
		lines[i].left.classList.add('hidden');
	for (let i = 0; i < lines.length; i++)
		lines[i].right.classList.add('hidden');
	for (let i = 0; i < lines.length; i++)
		lines[i].up.classList.add('hidden');
	for (let i = 0; i < lines.length; i++)
		lines[i].down.classList.add('hidden');
	moved = -1;
}

function enter_left(main) {
	const i = elementIndex(main);
	if (moved == i) {
		const level = lines[i].level;
		for (let j = i; j < lines.length; j++) {
			if (lines[j].level < level)
				break;
			decr_indent(j);
		}
		set_targets(i);
		readjust();
	}
}

function enter_right(main) {
	const i = elementIndex(main);
	if (moved == i) {
		const level = lines[i].level;
		for (let j = i; j < lines.length; j++) {
			if (lines[j].level < level || lines[j].level == level && j != i)
				break;
			incr_indent(j);
		}
		set_targets(i);
		readjust();
	}
}

function enter_up(main) {
	const i = elementIndex(main);
	if (moved == i) { 
		remove_line(i-1);
		decr_indent(i-1);
		readjust();
	}
}

function enter_down(main) {
	const i = elementIndex(main);
	if (moved == i) { 
		const level = lines[i].level;
		incr_indent(i);
		add_singleton_line(i, level);
		set_targets(i);
		readjust();
	}
}

function check_entry(main) {
	const i = elementIndex(main);
	const line = lines[i];
	if (line.singleton && line.entry.value == '' && 
			i+1 < lines.length && lines[i+1].level < lines[i].level) {
		remove_line(i);
		readjust();
	}
}

function incr_indent(i) {
	const line = lines[i];
	line.main.insertBefore(indentation(lines[i].level), line.handle);
	line.level += 1;
}

function decr_indent(i) {
	const line = lines[i];
	line.main.removeChild(line.main.children[lines[i].level-1]);
	line.level -= 1;
}

function indentation(level) {
	const indent = document.createElement('div');
	indent.className = 'indent';
	if (level % 3 == 0)
		indent.style.color = 'red';
	else if (level % 3 == 1)
		indent.style.color = 'blue';
	return indent;
}

function readjust() {
	complete_structure();
	check_consistency();
}

function set_targets(i) {
	if (i < 0)
		return;
	if (can_move_left(i))
		lines[i].left.classList.remove('hidden');
	else
		lines[i].left.classList.add('hidden');
	if (can_move_right(i))
		lines[i].right.classList.remove('hidden');
	else
		lines[i].right.classList.add('hidden');
	if (can_move_up(i))
		lines[i].up.classList.remove('hidden');
	else
		lines[i].up.classList.add('hidden');
	if (can_move_down(i))
		lines[i].down.classList.remove('hidden');
	else
		lines[i].down.classList.add('hidden');
}

function can_move_left(i) {
	return lines[i].level > 0;
}

function can_move_right(i) {
	return true;
}

function can_move_up(i) {
	return i > 0 && lines[i-1].singleton && lines[i-1].entry.value == '';
}

function can_move_down(i) {
	return true;
}

function complete_structure() {
	if (lines[0].level > 0)
		add_singleton_line(0, 0);
	let i = 0;
	let prev_level = 0;
	while (i < lines.length) {
		if (!lines[i].singleton && i+1 < lines.length && lines[i+1].level > lines[i].level) {
			add_singleton_line(i+1, lines[i].level);
		} else if (i+1 < lines.length && lines[i+1].level > lines[i].level+1) {
			add_singleton_line(i+1, lines[i].level+1);
		} else if (lines[i].singleton && lines[i].entry.value == '' && i+1 < lines.length &&
				lines[i+1].level <= lines[i].level) {
			remove_line(i);
		} else {
			i += 1;
		}
	}
}

function check_consistency() {
	var message = null;
	for (let i = 0; i < lines.length; i++) {
		set_error(i, false);
	}
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].entry.value == '') {
			lines[i].entry.classList.add('error');
			message = 'empty text field';
		}
	}
	if (!message)
		message = check_tree(0, lines.length, 0);
	return message;
}

function check_tree() {
	if (lines[0].level != 0) {
		set_error(0, true);
		return 'first line non-zero level';
	}
	const zero_level = lines.slice(1).filter((line) => line.level == 0);
	if (zero_level.length > 0) {
		set_error(0, true);
		return 'multiple zero-level lines';
	}
	return check_subtree(1, lines.length, 1);
}

function check_subtree(i, j, level) {
	const par = i-1;
	var message = null;
	if (i >= j)
		return message;
	var n_sub = 0;
	while (i < j) {
		const line = lines[i];
		if (line.level != level) {
			set_error(i, true);
			return 'gap in levels';
		}
		let k = i+1;
		while (k < j && level < lines[k].level)
			k++;
		if (!message) {
			if (line.singleton) {
				message = check_subtree(i+1, k, level+1);
			} else {
				if (i+1 < k) {
					message = 'node should not have children';
					set_error(i, true);
				}
			}
		}
		n_sub++;
		i = k;
	}
	if (n_sub <= 1) {
		message = 'node with single child';
		set_error(par, true);
	}
	return message;
}

function set_error(i, b) {
	if (i < lines.length) {
		if (b)
			lines[i].entry.classList.add('error');
		else
			lines[i].entry.classList.remove('error');
	}
}

function extract() {
	const root = lines[0];
	const text = root.entry.value;
	const subtrees = extract_subtrees(1, lines.length, 1);
	return { text, subtrees };
}

function extract_subtrees(i, j, level) {
	var subtrees = []
	while (i < j) {
		let k = i+1;
		while (k < j && level < lines[k].level)
			k++;
		const text = lines[i].entry.value;
		if (lines[i].singleton) {
			const subtrees = extract_subtrees(i+1, k, level+1);
			const child = { text, subtrees };
			subtrees.push(child);
		} else {
			const index = lines[i].index;
			const child = { text, index };
			subtrees.push(child);
		}
		i = k;
	}
	return subtrees;
}

function submit() {
	const message = check_consistency();
	if (message) {
		window.alert(message);
	} else {
		const extracted = extract();
		const blob = new Blob([JSON.stringify(extracted)], { type: 'text/json' });                  
		const downloadLink = document.createElement('a');                                              
		downloadLink.href = URL.createObjectURL(blob);                                                 
		downloadLink.download = text_id + '.json';                                                      
		downloadLink.click();
	}
}


function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Prompt user for file ID
    const file_id = prompt("Please enter the file ID (e.g., wsj_0620):");
    if (!file_id) {
        alert("File ID is required.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        // Split content into non-empty, trimmed lines
        const sentences = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        // Optional: display sentences for confirmation
        displaySentences(sentences);

        // Call your main function with user input and file content
        fill_form(file_id, sentences);
    };

    reader.readAsText(file);
}

function displaySentences(sentences) {
    console.log("Sentences:");
    sentences.forEach((sentence, index) => {
        console.log(`${index + 1}: ${sentence}`);
    });
}

function test_load() {
	fill_form('wsj_0621', [
	'First Tennessee National Corp. said it would take a $4 million charge in the fourth quarter, as a result of plans to expand its systems operation.',
	'The banking company said it reached an agreement in principle with International Business Machines Corp. on a systems operations contract calling for IBM to operate First Tennessee\'s computer and telecommunications functions.',
	'Further, under the agreement, First Tennesse would continue to develop the software that creates customer products and sevices.',
	'Because personal computers will soon be on the desks of all of our tellers, and customer service and loan representatives, information will be instantly available to help customers with product decisions and provide them with information about their accounts," according to John Kelley, executive vice president and corporate services group manager at First Tennessee.',
	'However, about 120 employees will be affected by the agreement.',
	'First Tennessee, assisted by IBM, said it will attempt to place the employees within the company, IBM or other companies in Memphis.',
	'The process will take as many as six months to complete, the company said.',
	'The agreement is subject to the banking company\'s board approval, which is expected next month.']);
}

//window.addEventListener('DOMContentLoaded',
//	function (event) {
//		test_load();
//s	});

window.addEventListener('DOMContentLoaded', function () {
		const fileInput = document.getElementById('fileInput');
		fileInput.addEventListener('change', handleFileUpload);
	})
//document.getElementById('fileInput').addEventListener('change', handleFileUpload);
