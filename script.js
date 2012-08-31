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
		header.OptHeader.entryPoint = '0x' + header.OptHeader.entryPoint.toString(16).toUpperCase();
		jQuery('#fileInfos').html(ich.fileInfoTemplate(header));
	};

	disassembler.onSectionTable = function(table) {
		for (var i=0; i < table.length; ++i) {
			table[i].virtualAddress = '0x' + table[i].virtualAddress.toString(16).toUpperCase();
			table[i].rawDataOffset = '0x' + table[i].rawDataOffset.toString(16).toUpperCase();
		}
		
		jQuery('#sectionTable').html(ich.sectionTableTemplate({entries: table}));
	};
	
	disassembler.onAssembly = function(data) {
		jQuery('#assembly').text(data);
	}
	
	disassembler.start();
}
