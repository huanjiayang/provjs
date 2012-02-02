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
					var accJSON = new provjs(this.json.account[account]);
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
	var parseresult = { "identifier" : null,
						"type" : null,
						"account" : "default",
						"cstrrlat" : []};
	var arglist = argument.split("<<");
	for(var i=0;i<arglist.length;i++){
		arglist[i]=arglist[i].removeSurroundingSpace();		
	}
	for(var i=0;i<arglist.length;i++){
		if(arglist[i].indexOf(">>") >= 0){
			var cstr = arglist[i].split(">>");
			if (cstr.length == 3){
				var cstrrlat = {};
				cstrrlat["object"]=cstr[2];
				cstrrlat["relation"]=cstr[1];
				cstrrlat["subject"] = cstr[0];
				parseresult["cstrrlat"].push(cstrrlat);
			}
		}
		else if(arglist[i].startsWith("account#")){
			parseresult["account"]=arglist[i].split("account#")[1];
		}
		else if(arglist[i].startsWith("#")){
			parseresult["identifier"]=arglist[i];
		}
		else{
			parseresult["type"] = arglist[i];
		}
	}
	return parseresult;
}

function provjsQuery(argument){
	var rtlist = [];
	if(typeof argument == "undefined")argument=null;
	if(argument==null) alert("No parametre given for query");
	else {// parse argument here.
//		alert(argument);
		querypara = this._parseQueryArgument(argument);
//		alert(JSON.stringify(querypara));
//		myjson.q("entity << $>>wasGeneratedBy>>#a0 << account>>#acc0")
		
		
	}
}

String.prototype.startsWith = function (str){
	return this.indexOf(str) == 0;
};

String.prototype.removeSurroundingSpace = function (){
	var rt = this.substring(0);
	if (rt.startsWith(" ")) {
		rt=rt.substring(1);
	}
	else if (rt[rt.length-1]==" ") {
		rt=rt.substring(0,(rt.length)-1);
	}
	if (rt.startsWith(" ") || (rt[rt.length-1]==" "))	{
		rt=rt.removeSurroundingSpace();
	}
	return rt;
};

Array.prototype.hasItem = function (item){
	var rt = false;
	for(var i=0;i<this.length;i++)
		if (this[i]==item)
			rt = true;
	return rt;
};