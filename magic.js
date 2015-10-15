var tab = "csv", header_alignment=[], array_storage="", form_rows=0, form_cols=0, prettify_md=true, debug=false;

var example_csv='Feature, Description, Example\n'+
                'Renders markdown, Uses showdown library to render contents of table cells, **Just** *like* ``this``\n'+
                'Escapes quotes, Easier to edit without so only uses them when necessary, "It does an \\\"okay\\\" job"\n'+
                'Preview table matches GitHub style, As closely as possible, Look!\n'+
                'Preserves alignment, Between all views, Switch to CSV and back\n'+
                'Import HTML, Converts back and forth, Copy from *Inspect Element*\n'+
                'Markdown formatting, "Adds spaces, makes things more legible",Markdown tab\n'+
                'Form view, "Create tables with buttons!",Form tab\n'+
                'Hasn\\\'t caught fire yet, So far, Huzzah!';

$(window).load(function() {

  // Initial div
  layout(true);

  if (tab!=="md") { $('#md-options').hide(); }
  if (tab!=="import") { $('#import-options').hide(); }

  // bind form buttons
  $("body").delegate(".button-row-duplicate", "click", function() {
    if (typeof $(this).closest("tr")[0].rowIndex === 'number') {
      form_duplicate_row($(this).closest("tr")[0].rowIndex);
    }
   });

   $("body").delegate(".button-row-remove", "click", function() {
     if (typeof $(this).closest("tr")[0].rowIndex === 'number') {
       form_remove_row($(this).closest("tr")[0].rowIndex);
     }
    });

    $("body").delegate(".button-col-duplicate", "click", function() {
      if (typeof $(this).closest("td")[0].cellIndex === 'number') {
        form_duplicate_col($(this).closest("td")[0].cellIndex);
      }
     });

    $("body").delegate(".button-col-remove", "click", function() {
      if (typeof $(this).closest("td")[0].cellIndex === 'number') {
        form_remove_col($(this).closest("td")[0].cellIndex);
      }
     });

    $("#check-formatter").change(function() {
      if ($("#check-formatter").is(':checked')) {
    	   prettify_md=true;
    	} else {
        prettify_md=false;
    	}

      if (tab==="md") {
        // refresh.
        var array = md2array($("textarea").val());
        var md = array2md(array);
        $('textarea').val(md);
      }

    });



});


function layout(editing) {

  if (editing) {
    var html = "<textarea wrap=off></textarea>";
  } else {
    var html = "<div class=\"preview\"></div>";
  }

  $("#display").html(html);

}

function changeTab(newTab) {

    if (tab!==newTab) {

      // Convert to array
      var input = $("textarea").val(), array = [];

      if (tab==="md") { array = md2array(input); }
      if (tab==="csv") { array = csv2array(input); }
      if (tab==="html") { array = html2array(input); }
      if (tab==="form") { array = form2array(); }
      if (tab==="preview") { array = array_storge; }

      // Convert from array into new format, set other vars..
      var new_layout=true, output="";

      if (newTab==="md") {
        output = array2md(array);
        new_layout=true;
      }

      if (newTab==="csv") {
        output = array2csv(array);
        new_layout=true;
      }

      if (newTab==="html") {
        output = array2html(array);
        new_layout=true;
      }

      if (newTab==="form") {
        output = array2form(array);
        new_layout=false;
      }

      if (newTab==="preview") {
        output = array2preview(array);
        array_storge = array; // store array
        new_layout=false;
      }

      // Update DOM
      layout(new_layout);

      // Output
      if (new_layout) {
        $('textarea').val(output);
      } else {
        $('.preview').html(output);
      }

      // Update classes
      $('.tabnav-tab').removeClass('selected');
      $('#tab-'+newTab).addClass('selected');

      if (tab==='md') {
        $('textarea').removeClass('md');
        $('#md-options').hide();
      }

      if (newTab==='md') {
        $('textarea').addClass('md');
        $('#md-options').show();
      }

      // Update variables
      tab = newTab;

    }

}


function csv2array(csv) {

  var row = 0, col = 0, quote = false, doublequote = false, save = false,
  escape = false, buffer = "", array=[];

  for (var c = 0; c < csv.length; c++) {

    var char = csv[c], skip = false;

    // Comma or new line - if not within quotes.
    if ( ( (char===",") || (char==="\n") ) && (!quote) && (!doublequote) ) {
      save=true;
    }

    // doublequote
    if ( (!escape) && (!quote) && (char==="\"") ) {
      if (doublequote) {
        doublequote=false;
      } else {
        doublequote=true;
      }
      skip=true;
    }

    // quote
    if ( (!escape) && (!doublequote) && (char==="'") ) {
      if (quote) {
        quote=false;
      } else {
        quote=true;
      }
      skip=true;
    }

    // Escape character, effects next character so
    // this condition should be last.
    if ( (char==="\\") && (!escape) ) {
      escape = true;
      skip=true;
    } else {
      escape = false;
    }

    // Add to buffer
    if ( (!save) && (!skip) ) {
      buffer+=char;
    }

    // Last character?
    if ( c === (csv.length-1) ) { save=true; }

    // Add to array
    if (save) {

      if (!array[row]) array[row]=[];

      array[row][col]=buffer.trim();
      buffer="";
      save=false;

      if (char===",") { col++; }
      if (char==="\n") { col=0; row++; }

    }

  }

  array = addEmptyCells(array);

  if (debug) { console.table(array); }

  return array;

}

function md2array(md) {

  var row = 0, col = 0, cursor=0, buffer="", escape = false, save = false,
  pipebefore = false, array = [];

  for (var c = 0; c < md.length; c++) {

    var char = md[c], skip = false;

    // Pipes
    if ( (char==="|") && (!escape) ) {
      if (cursor>0) {
        save=true;

        // Check ahead, if this is a closing pipe/trailing space, we can skip it.
        if ( (md[c+1]==="\n") || ( (md[c+1]===" ") && (md[c+2]==="\n") ) || (c === (md.length-1)) ) { skip=true; save=false; }

      } else {
        skip=true; // First pipe
      }
    }

    // New lines
    if (char==="\n") {
      save=true;
    }

    if ( (char==="\\") && (!escape) ) {
      escape = true;
    } else {
      escape = false;
    }

    // buffer
    if ( (!save) && (!skip) ) {
      buffer+=char;
    }

    // Last character?
    if ( c === (md.length-1) ) { save=true; }

    // Save to array
    if (save) {

      if (!array[row]) array[row]=[];

      array[row][col]=buffer.trim();
      buffer="";
      save=false;

      if (char==="|") { col++; }
      if (char==="\n") { col=0; cursor=-1; row++; }

    }

    cursor++;

  }

  // Process headers
  if (array[1]) {
    var headers = array[1], headers_okay=true;
    header_alignment=[];

    for (var h = 0; h < headers.length; h++) {

      var header = headers[h], hLength=header.length, start = false,
      end = false;

      for (var c = 0; c < header.length; c++) {
        if ( (c===0) && (header[c]===":") ) start = true;
        if ( (header[c]!==":") && (header[c]!=="-") ) headers_okay = false;
        if ( (c===(header.length-1)) && (header[c]===":") ) end = true;
      }


      header_alignment[h]="l"; // Default
      if ( (start) && (!end) ) { header_alignment[h]="l"; }
      if ( (start) && (end) ) { header_alignment[h]="c"; }
      if ( (!start) && (end) ) { header_alignment[h]="r"; }

    }

    if (headers_okay) {
      // There are headers, so let's remove them.
      array.splice(1,1);
    } else {
      // fail!
    }

  }

  if (debug) { console.table(array); }

  array = addEmptyCells(array);

  return(array);

}

function html2array(html) {

  var array = [], col_count=0;

  // Is there a <thead>?
  var search = html.indexOf("<thead");
  if (search>-1) {

    // Try and split html in half.
    var html_split = html.split("</thead");

    if (html_split.length===2) {

      // 1 defined <thead> section, so pick out cells from <thead>
      // and hand the second part of html to the rest of the function.
      var thead = html_split[0];
      var row = html2array_cells(thead, "th");

      if (row.length>0) {
        array.push(row);
        col_count=row.length;
      }

      html = html_split[1];

    } else {
      //potential for a validation error?
    }

  }

  // Split html by tr
  var tr = html.split("<tr");

  for (var t = 0; t < tr.length; t++) {

    var html_row = tr[t];
    row = html2array_cells(html_row, "td");

    if (row.length>0) {

      // If col_count is not set by thead, set it.
      if (array.length===0) { col_count=row.length; }

      if (row.length===col_count) {
        array.push(row);
      } else {

        // Validation error, try and fix.
        if (col_count>row.length) {

          // Cells missing, add blanks
          var loopfor=(col_count-row.length);
          for (var l = 0; l < (col_count-row.length); l++) {
            row.push('');
          }

          array.push(row);

        } else {

          // Too many cells, ignore.

        }


      }

    }

  }

  if (debug) { console.table(array); }

  array = addEmptyCells(array);

  return array;

}

function html2array_cells(html, splitter) {

  var result = [], td = html.split("<"+splitter), content=false;

  for (var d = 0; d < td.length; d++) {

    // Pop the <td/<th back on, as to not break the regex
    if (td[d]!=="") {

      var html_cell = "<"+splitter+td[d];

      // Strip html and tidy
      var cell = html_cell.replace(/<(?:.|\n)*?>/gm, '');
      cell=cell.trim();

      // Switch &nbsp; back into spaces. This is a hack.
      cell=cell.replace(/&nbsp;/g, ' ');

      if ( (cell!=="") ) { result.push(cell); }

    }

  }

    return result;

}

function array2html(array) {

  if (array.length===0)  {

    var html = "";

  } else {

    // Produce a neat table.
    var html = "<table>\n", startat=0;

    if (array.length>1) {
      // Make a <thead> section

      // Start main loop one later!
      startat=1;

      html += "  <thead>\n";

      html += array2html_cells(array[0],"th");

      html += "  </thead>\n"+
              "  <tbody>\n";

    }

    // Loop through the rest of the table.
    for (var r = startat; r < array.length; r++) {

      html += array2html_cells(array[r], "td");

    }

    if (startat===1) { html += "  </tbody>\n"; }

    html += "</table>";

  }

  return html;

}

function array2html_cells(row, tag) {

var html = "    <tr>\n";

  for (var c = 0; c < row.length; c++) {

    // Switch blank cell and spaces into &nbsp;
    if ((row[c]==="")||(row[c]===" ")) { row[c]="&nbsp;"; }

    html += "      <"+tag+">"+row[c]+"</"+tag+">\n";

  }

  html += "    </tr>\n";

  return html;

}

function form2array() {

  var array = [];

  for (var r = 0; r < form_rows; r++) {

    var currentrow=[];

    for (var c = 0; c < form_cols; c++) {

      // Gather item
      var item = $('#form-'+r+'-'+c).val();

      // Save to row
      currentrow[c]=item;

    }

    // Save to array
    array[r]=currentrow;

  }

  array = addEmptyCells(array);

  return array;

}

function addEmptyCells(array) {

  // Length of longest row
  var max = 0;

  for (var r = 0; r < array.length; r++) {
    if (array[r].length>max) max = array[r].length;
  }

  // Add blank cells for any that don't reach that length
  for (var r = 0; r < array.length; r++) {
    if (array[r].length<max) {
      var loop = max-array[r].length;
      for (var l = 0; l < loop; l++) {
        array[r].push('');
      }
    }
  }

  return array;

}

function array2csv(array) {

  var csv = "";

  for (var r = 0; r < array.length; r++) {

      var row = array[r];

      for (var c = 0; c < row.length; c++) {

        var item = row[c];

        // Are there any doublequotes?
        var quotes=false;
        for (var i = 0; i < item.length; i++) { if (item[i]==="\"") quotes = true; }

        // Add slashes
        if (quotes) { item = item.replace(/"/g, '\\"'); }

        // Are there any single quotes?
        for (var i = 0; i < item.length; i++) { if (item[i]==="'") quotes = true; }

        // Are there any commas?
        for (var i = 0; i < item.length; i++) { if (item[i]===",") quotes = true; }

        //item = item.replace(/'/g, "\\'");

        // Output
        if (c>0) csv += ", ";
        if (quotes) { csv += "\""; }
        csv += item;
        if (quotes) { csv += "\""; }

      }

      if (r<array.length) { csv += "\n"; }

  }

  return csv;

}

function array2md(array) {

  var md = "", cell_sizes = [];

  // Gather max cell sizes for each column.
  for (var r = 0; r < array.length; r++) {
    for (var c = 0; c < array[r].length; c++) {
      if ( (!cell_sizes[c]) || (array[r][c].length>cell_sizes[c]) ) {
        cell_sizes[c]=array[r][c].length;
      }
    }
  }

  for (var r = 0; r < array.length; r++) {

      var row = array[r];

      for (var c = 0; c < row.length; c++) {

        var item = row[c];

        // Output
        if (c>0) { md += " "; }
        md += "| ";
        md += item;

        if (prettify_md) {

          // Add spaces to fill the gaps
          var spaces = cell_sizes[c] - item.length;

          // Must always be at least 3
          if ((spaces<1)&&(item.length===0)) { spaces=1; }

          for (var s = 0; s < spaces; s++) {
            md += " ";
          }

        }

      }

      md += " |";
      if (r<array.length) { md += "\n"; }

      // Headers /!!/
      if (r==0) {

          md += "|";
          for (var c = 0; c < row.length; c++) {

            var dashes="---";

            // Extend dashes if prettifying.
            if (prettify_md) {

              var spaces = cell_sizes[c] + 2;

              // Make room for formatting colons
              if (header_alignment[c]==="c") {spaces=spaces-2;}
              if (header_alignment[c]==="r") {spaces=spaces-1;}

              for (var s = 3; s < spaces; s++) {
                dashes += "-";
              }

            }

            var h=dashes;
            if (header_alignment[c]==="c") h=":"+dashes+":";
            if (header_alignment[c]==="r") h=dashes+":";

            md+=h+"|";
          }
          md+="\n";
      }

  }

  return md;

}

function array2preview(array) {

  var html = "<table><thead>";

  for (var r = 0; r < array.length; r++) {

      var row = array[r];

      if (r===0) { fontweight="bold;" } else { fontweight="normal"; }
      html += "<tr style=\"font-weight:"+fontweight+"\">";

      for (var c = 0; c < row.length; c++) {

        var item = row[c];

        var align = "left";
        if (header_alignment[c]==="c") align = "center";
        if (header_alignment[c]==="r") align = "right";

        html += "<td style=\"text-align: "+align+";\">";
        html += md2html(item);
        html += "</td>";

      }

      html += "</tr>";

      if (r===0) {
        html += "</thead><tbody>";
      }

  }

  html += "</tbody></table>";

  if (array.length===0) { html += "<div class=\"flash flash-warn flash-with-icon\">"+
                                  "<span class=\"octicon octicon-alert\"></span>"+
                                  "Nothing to preview.</div>"
                        }

  return html;

}

function array2form(array) {

  form_cols=0;

  var html = "<div class=\"buttonbar\">"+
             "<button class=\"btn btn-sm\" type=\"button\" onclick=\"form_add_row();\">Add row</button> "+
             "<button class=\"btn btn-sm\" type=\"button\" onclick=\"form_add_col();\">Add column</button>"+
             "</div>";

  html += "<table class=form><thead>";

  for (var r = 0; r < array.length; r++) {

      var row = array[r];

      if (r===0) { fontweight="bold;" } else { fontweight="normal"; }
      html += "<tr style=\"font-weight:"+fontweight+"\">";

      for (var c = 0; c < row.length; c++) {

        var item = row[c];
        item = item.replace(/"/g, '&quot;'); // replace "s

        html += "<td>";
        html += "<input id='form-"+r+"-"+c+"' value=\"";
        html += item;
        html += "\"";
        if (r===0) { html += " class=header"; }
        html += "></td>";

      }

      html += "<td class=\"button\">"+
              "<button class=\"btn btn-sm button-row-duplicate\" type=\"button\"><span class=\"octicon octicon-repo-forked\"></span></button> "+
              "<button class=\"btn btn-sm btn-danger button-row-remove\" type=\"button\"><span class=\"octicon octicon-trashcan\"></span></button>"+
              "</td>";




      html += "</tr>";

      if (r===0) {
        html += "</thead><tbody>";
      }

      if (row.length>form_cols) { form_cols=row.length; }

  }

  form_rows=array.length;

  if (array.length>0) {

    html += "<tr>";

      for (var c = 0; c < form_cols; c++) {
        html += "<td class=\"button\" align=\"center\">"+
                "<button class=\"btn btn-sm button-col-duplicate\" type=\"button\"><span class=\"octicon octicon-repo-forked\"></span></button> "+
                "<button class=\"btn btn-sm btn-danger button-col-remove\" type=\"button\"><span class=\"octicon octicon-trashcan\"></span></button>"+
                "</td>";
      }

    html += "</tr>";

  }

  html += "</tbody></table>";

  if (array.length===0) { html += "<div class=\"flash flash-with-icon\">"+
                                  "<span class=\"octicon octicon-tools\"></span>"+
                                  "You can use the tools above to create your table or enter some markdown or CSV on the other tabs.</div>"
                        }

  return html;

}



function md2html(md) {
  // showdown can't do tables, but it
  // can do the formatting inside. Yay.
  var converter = new showdown.Converter();
  return converter.makeHtml(md);
}

// form modification
function form_redraw(array) {
  var html = array2form(array);
  $('.preview').html(html);
}

function form_add_row() {

  // Save current form to array
  var array = form2array();

  // Add a row.
  var newrow=[];

    // How many columns?
    var colcount=1;
    if (array[0]) {colcount=array[0].length;}

    // Loop and add.
    for (var c = 0; c < colcount; c++) {
    newrow[c]="";
    }

    array.push(newrow);

  // Redraw
  form_redraw(array);

}

function form_add_col() {

  // Save current form to array
  var array = form2array();

  // Loop through array, adding one to the end of each row.
  for (var r = 0; r < array.length; r++) {
    array[r].push("");
  }

  // If empty, we add one.
  if (array.length===0) { array.push([""]); }

  // Redraw
  form_redraw(array);

}

function form_duplicate_row(row) {

  // Save current form to array
  var array = form2array();

  if (debug) { console.log('Duplicating: '+row); }

  // Splice the row
  array.splice(row,0,array[row]);

  // Redraw
  form_redraw(array);

}

function form_remove_row(row) {

  // Save current form to array
  var array = form2array();

  if (debug) { console.log('Deleting: '+row); }

  // Splice the row
  array.splice(row,1);

  // Redraw
  form_redraw(array);
}

function form_duplicate_col(col) {

  // Save current form to array
  var array = form2array();

  if (debug) { console.log('Duplicating: '+col); }

  // Loop through array, duplicating as we go :3
  for (var r = 0; r < array.length; r++) {
      array[r].splice(col,0,array[r][col]);
  }

  // Redraw
  form_redraw(array);

}

function form_remove_col(col) {

  // Save current form to array
  var array = form2array();

  if (debug) { console.log('Deleting: '+col); }

  // Loop through array, slicing col from each row.
  for (var r = 0; r < array.length; r++) {
    array[r].splice(col,1);
  }

  // If columns are all gone, zap the rows too.
  if (array[array.length-1].length===0) { array=[]; }

  // Redraw
  form_redraw(array);

}

function fill_example() {

  var r = confirm("This will clear whatever you're working on and replace it with some example data. Cool?");
  if (r == true) {

    // Simulate switching to preview.
    layout(false);
    $('textarea').removeClass('md');
    $('#md-options').hide();

    // Convert example csv to array
    var array = csv2array(example_csv);
    header_alignment=['l','l','r'];

    // And to html
    var html = array2preview(array);

    array_storge = array; // Store the array

    $('.preview').html(html);

    $('.tabnav-tab').removeClass('selected');
    $('#tab-preview').addClass('selected');

    // Update variables
    tab = 'preview';

  } else {
      // not cool.
  }

}
