function fromJSONtoHTML(provjson)
{	var html = "";
	for (var key in provjson) {
		html = html + key + ":{<br>";
		if (key=="prefix"){
			for (var prefix in provjson.prefix)
				html = html + "&nbsp;&nbsp;&nbsp;&nbsp;"+prefix+" : " + provjson.prefix[prefix]+"<br>";
		}
		else if (key=="account"){
			for (var account in provjson.account)
				html = html + "&nbsp;&nbsp;&nbsp;&nbsp;"+account+" : " + fromJSONtoHTML(provjson.account[account])+"<br>";
		}
		else{
			for (var record in provjson[key]){
				html = html + "&nbsp;&nbsp;&nbsp;&nbsp;"+record+" : <br>";
				for (var attr in provjson[key][record]){
					html = html + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
					html = html + attr +" : "+provjson[key][record][attr]+"<br>";
				}
			}
		}
		html = html + "}<br><br><p>";
		}
	return html
}


function PROVLiteral(value,type){
	this.value = value;
	this.type = type;
	this.equals = equals;
}

function equals(x){
	if ( x === this ) return true;
	else return ((x.value == this.value)&&(x.type==this.type));
}


function provjs(json){
	this.json = json;
	this._visitedrecord = [];
	this._provdmterms = {};
	this._provdmterms["element"] = ["activity",
	                                "agent",
			                        "entity",
			                        "note"];
	this._provdmterms["relation"] = ["Used",
		                             "actedOnBehalfOf",
		                             "alternateOf",
		                             "hasAnnotation",
		                             "specializationOf",
		                             "wasAssociatedWith",
		                             "wasDerivedFrom",
		                             "wasEndedBy",
		                             "wasGeneratedBy",
		                             "wasStartedBy",
		                             "tracedTo",
		                             "wasInformedBy",
		                             "wasRevisionOf",
		                             "wasAttributedTo",
		                             "wasQuotedFrom",
		                             "wasSummaryOf",
		                             "hadOriginalSource"];
	this._provdmterms["record"] = ["account"].concat(this._provdmterms["element"],this._provdmterms["relation"]);

	this.getNamespaceDict = getNamespaceDict;
	this.processJSON = processJSON;
	this.resolveQname = resolveQname;
	this.processValue = processValue;

	this.nsdict = this.getNamespaceDict();
	this.container = this.processJSON();
	
	this._parseQueryArgument = _parseQueryArgument;
	this.q = provjsQuery;
}

function getNamespaceDict(){
	var nsdict = {};
	for (var key in this.json)
		if (key=="prefix")
			for (var prefix in this.json.prefix)
				nsdict[prefix] = this.json.prefix[prefix];
	return nsdict;	
}

function processJSON(){
	var container = {};
	testmsg = "";
	for (var key in this.json) {
		if (key=="account"){
			for (var account in this.json.account){
				if ($.inArray(account,this._visitedrecord) == -1){
					this._visitedrecord.push(account);
					var accURI = this.resolveQname(account);
					if(typeof container["account"] == "undefined")
						container["account"]={};
					accJSON = new provjs(this.json.account[account]);
					accJSON.nsdict = this.nsdict;
					accJSON.container = accJSON.processJSON();
					container["account"][accURI] = accJSON.container;
					container["account"][accURI]["RESERVED_provjstype"] = "account";
				}
			}
		}
		else if (key!="prefix"){
			if(this._provdmterms["record"].indexOf(key) >= 0){
				for (var record in this.json[key]){
					var recordURI = this.resolveQname(record);
					if(typeof container[key] == "undefined")container[key]={};
					container[key][recordURI]={};
					for (var attr in this.json[key][record]){
						var attrURI = this.resolveQname(attr);
						// test code
						testmsg = testmsg + "<br>"+ this.json[key][record][attr].toString() + isPROVArray(this.json[key][record][attr]).toString();
						// end test code
						var value = this.processValue(this.json[key][record][attr]);
						//test code
						testmsg = testmsg + "<br>&nbsp;&nbsp;&nbsp;&nbsp;"+ value.toString();
						$('#test').html(testmsg);
						//end test code
						container[key][recordURI][attrURI]=value;
						container[key][recordURI]["RESERVED_provjstype"] = key;
					}
				}
			}
			else{
				var attrURI = this.resolveQname(key);
				var value = this.processValue(this.json[key]);
				container[attrURI] = value;
			}
		}
	}
	return container;
}

function resolveQname(qname){
	var URI = qname;
	
	return URI;
}

function processValue(value){
	var rt = [];
	if (isPROVArray(value)){
		if (value[1]=="prov:array"){
			for(var i=0;i<value[0].length;i++){
				rt.push(this.processValue(value[0][i])[0]);
			}
		}
		else{
			rt.push(new PROVLiteral(value[0],value[1]));
		}
	}
	else{
		rt.push(value);
	}
	return rt;
}

function isPROVArray(obj){
	var rt = false;
		if (obj.constructor.toString().indexOf("Array") != -1)
			if(obj.length == 2)
					rt = true;
	return rt;
}

function _parseQueryArgument(argument){
	var parseresult = {};
	if(argument.indexOf("<<") != -1){
		parseresult["cstrdirection"] = object;
		parseresult["cstrtype"] = argument.split("<<")[1];
		parseresult["recordpara"] = argument.split("<<")[0];
	}
	else if(argument.indexOf(">>") != -1){
		parseresult["cstrdirection"] = subject;
		parseresult["cstrtype"] = argument.split(">>")[1];
		parseresult["recordpara"] = argument.split(">>")[0];
	}
	else{
		parseresult["recordpara"] = argument;
	}
	if(parseresult["recordpara"].startsWith("#")){
		parseresult["recordid"] = parseresult["recordpara"].substring(1);
	}
	else if (parseresult["recordpara"].startsWith(".")){
		parseresult["recordtype"] = parseresult["recordpara"].substring(1);
	}
	else{
		parseresult["recordtype"] = parseresult["recordpara"];
	}
	return parseresult;
}

function provjsQuery(argument){
	var rtlist = [];
	if(typeof argument == "undefined")argument=null;
	if(argument==null) alert("No parametre given for query");
	else {// parse argument here.
//		alert(argument);
		var querypara = this._parseQueryArgument(argument);
//		alert(JSON.stringify(querypara));
		
		
	}
}

String.prototype.startsWith = function (str){
	return this.indexOf(str) == 0;
};
