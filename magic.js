var tab = "csv", header_alignment=[], array_storage="", form_rows=0, form_cols=0;

var example_csv='Feature, Description, Example\n'+
                'Renders markdown, Uses the showdown library to render contents of table cells for you, **Just** *like* ``this``\n'+
                'Escapes quotes, CSV is easier to edit without so only uses them when necessary, "It does an \\\"okay\\\" job"\n'+
                'Preview table matches GitHub style, As closely as possible, Look!\n'+
                'Preserves alignment, Between all views, Switch to CSV and back\n'+
                'Hasn\\\'t caught fire yet, So far, Hurrah';

function layout(editing) {

  if (editing) {
    var html = "<textarea></textarea>";
  } else {
    var html = "<div class=\"preview\"></div>";
  }

  $("#display").html(html);

}

$(window).load(function() {
  layout(true);
});

function changeTab(newTab) {

    if (tab!==newTab) {

      var input = $("textarea").val();

      // What direction?

        // md > csv
        if ( (tab==="md") && (newTab==="csv") ) {

          layout(true);

          // Convert md to array
          var array = md2array(input);

          // Array to csv
          var csv = array2csv(array);

          // Pop into textarea
          $('textarea').val(csv);

        }

        // csv > md
        if ( (tab==="csv") && (newTab==="md") ) {

          layout(true);

          // Convert csv to array
          var array = csv2array(input);

          // Array to md
          var md = array2md(array);

          // Pop into textarea
          $('textarea').val(md);

        }

        // csv > form
        if ( (tab==="csv") && (newTab==="form") ) {

            layout(false);

            // Convert md to array
            var array = csv2array(input);

            // And to html
            var html = array2form(array);

            array_storge = array; // Store the array

            $('.preview').html(html);

        }

        // md > form
        if ( (tab==="md") && (newTab==="form") ) {

            layout(false);

            // Convert md to array
            var array = md2array(input);

            // And to html
            var html = array2form(array);

            $('.preview').html(html);

        }

        // form > md
        if ( (tab==="form") && (newTab==="md") ) {

           // Convert form into array
           var array = form2array();

           // Convet array into md
           var md = array2md(array);

           // Update design
           layout(true);

           // Pop into text area
           $('textarea').val(md);

        }

        // form > csv
        if ( (tab==="form") && (newTab==="csv") ) {

           // Convert form into array
           var array = form2array();

           // Convet array into md
           var csv = array2csv(array);

           // Update design
           layout(true);

           // Pop into text area
           $('textarea').val(csv);

        }

        // csv > preview
        if ( (tab==="csv") && (newTab==="preview") ) {

            layout(false);

            // Convert md to array
            var array = csv2array(input);

            // And to html
            var html = array2html(array);

            array_storge = array; // Store the array

            $('.preview').html(html);

        }

        // md > preview
        if ( (tab==="md") && (newTab==="preview") ) {

            layout(false);

            // Convert md to array
            var array = md2array(input);

            // And to html
            var html = array2html(array);

            array_storge = array; // Store the array

            $('.preview').html(html);

        }

        // form > preview
        if ( (tab==="form") && (newTab==="preview") ) {

            // Convert form to array
            var array = form2array();

            // And to html
            var html = array2html(array);

            // Update design late
            layout(false);

            array_storge = array; // Store the array

            $('.preview').html(html);

        }

        // preview > csv
        if ( (tab==="preview") && (newTab==="csv") ) {

           layout(true);

           // Convert stored array into csv
           var csv = array2csv(array_storge);

           // Pop into text area
           $('textarea').val(csv);

        }

        // preview > md
        if ( (tab==="preview") && (newTab==="md") ) {

           layout(true);

           // Convert stored array into md
           var md = array2md(array_storge);

           // Pop into text area
           $('textarea').val(md);
        }

        // preview > form
        if ( (tab==="preview") && (newTab==="form") ) {

            layout(false);

            // Convert array storage to form
            var html = array2form(array_storge);

            $('.preview').html(html);

        }


      // Update classes
      $('.tabnav-tab').removeClass('selected');
      $('#tab-'+newTab).addClass('selected');

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

  console.table(array);
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

        // Check ahead, if this is a closing pipe, we can skip it.
        if ( (md[c+1]==="\n") || (c === (md.length-1)) ) { skip=true; save=false; }

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

  console.table(array);

  return(array);

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
        item = item.replace(/'/g, "\\'");

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

  var md = "";

  for (var r = 0; r < array.length; r++) {

      var row = array[r];

      for (var c = 0; c < row.length; c++) {

        var item = row[c];

        // Output
        if (c>0) { md += " "; }
        md += "| ";
        md += item;

      }

      md += " |";
      if (r<array.length) { md += "\n"; }

      // Headers /!!/
      if (r==0) {
          md += "|";console.log(header_alignment);
          for (var c = 0; c < row.length; c++) {
            var h="---";
            if (header_alignment[c]==="c") h=":---:";
            if (header_alignment[c]==="r") h="---:";

            md+=h+"|";
          }
          md+="\n";
      }

  }

  return md;

}

function array2html(array) {

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

  var html = "<table><thead>";

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
        html += "\"></td>";

      }

      html += "</tr>";

      if (r===0) {
        html += "</thead><tbody>";
      }

      form_cols=row.length;

  }

  form_rows=array.length;

  html += "</tbody></table>";

  if (array.length===0) { html += "<div class=\"flash flash-warn flash-with-icon\">"+
                                  "<span class=\"octicon octicon-alert\"></span>"+
                                  "No data to load into form. Row creation <i>coming soon</i>.</div>"
                        }

  return html;

}

function md2html(md) {
  // showdown can't do tables, but it
  // can do formatting inside. Yay.
  var converter = new showdown.Converter();
  return converter.makeHtml(md);
}

function fill_example() {

  var r = confirm("This will clear whatever you're working on and replace it with some example data. Cool?");
  if (r == true) {

    // Simulate switching to preview.
    layout(false);

    // Convert example csv to array
    var array = csv2array(example_csv);
    header_alignment=['l','l','r'];

    // And to html
    var html = array2html(array);

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
