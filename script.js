"use strict";

jQuery(function() {
	jQuery('#disassembleFile').change(function(e) {
	    var files = e.target.files || e.dataTransfer.files;
	    
	    if (files.length > 0) {
	    	var file = files[0];
	    	
	    	var reader = new FileReader();
	    	reader.readAsArrayBuffer(file);
	    	
	    	reader.onload = function() {
	    		var buffer = new Uint8Array(reader.result);
	    		parseFile(buffer);
	    	};
	    }
	});
	
	jQuery('#contentPane').tabs().find( ".ui-tabs-nav" ).sortable({ axis: "x" });;
});

function parseFile(buf) {
	var disassembler = new Disassemblr(buf);
	
	disassembler.onError = function(e) {
		alert(e);
	};

	disassembler.onHeader = function(header) {
		jQuery('#fileInfos').text(JSON.stringify(header));
	};

	disassembler.onSectionTable = function(table) {
		jQuery('#sectionTable').text(JSON.stringify(table));
	};
	
	disassembler.start();
}
