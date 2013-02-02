/*
 Copyright (c) 2012-2013 by Jeremy "Colgate" Richardson and Thomas "TAT" Andresen

 Permission to use this software for any purpose without fee is hereby granted,
 provided that the above copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHORS DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
 INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHORS
 BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
 RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

 @author  Jeremy "Colgate" Richardson
 @author  Thomas "TAT" Andresen
*/

var a = function(a,b) {
    var c = '',e,f,g,h;
    if (a.normal !== undefined && a.min !== undefined) {
        h = a.normal-a.min;
        c = ' (' + (h/a.normal*100).toFixed(2) + '% saved)';
    }
	e = "javascript:(function(){var a=document.createElement('script');a.setAttribute('id','plugcubed-js');a.setAttribute('src','http://" + (b == "stable" ? "colgate" : "tatdk") + ".github.com/plugCubed/compiled/plugCubed";
	f = a === false ? 'An error occured, please try again later' : null;
	g = ".js');document.body.appendChild(a);}());";
	if (a !== false) {
		$("a." + b).attr("href",e + g);
		$("a." + b + ".min").attr("href",e + (a === false ? '' : '.min') + g);
	}
	$("pre." + b).text(f === null ? e + g : f);
	$("pre." + b + ".min").text(f !== null ? f : e + (a === false ? '' : '.min') + g);
    $("span." + b).text(a.normal !== undefined ? d(a.normal) : 'Unknown size');
    $("span." + b + ".min").text(a.min !== undefined ? d(a.min) + c : 'Unknown size');
},d = function(a) { return (a/1024).toFixed(2) + ' KB'; };

$(document).ready(function() {
    setTimeout(function() {
        try {
            $.ajax({
				url: 'http://colgate.github.com/plugCubed/js/size.json',
				type: 'get',
				error: function() { a(false,'stable'); },
				success: function(b) { a(JSON.parse(b),'stable'); }
			});
        } catch (e) { a({},'stable'); }
        try {
            $.ajax({
				url: 'http://tatdk.github.com/plugCubed/js/size.json',
				type: 'get',
				error: function() { a(false,'dev'); },
				success: function(b) { a(JSON.parse(b),'dev'); }
			});
        } catch (e) { a({},'dev'); }
    },50);
});