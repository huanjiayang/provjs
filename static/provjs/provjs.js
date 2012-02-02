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
}

function PROVLiteral_equals(x,y){
	if ( x === y ) return true;
	else return ((x.value == this.value)&&(x.type==this.type));
}


function provjs(json){
	this.json = json;
	this._visitedrecord = [];
	this._queriedrecord = [];
	this._provdmterms = {};
	this._provdmterms["element"] = ["activity",
	                                "agent",
			                        "entity",
			                        "note"];
	this._provdmterms["relation"] = ["used",
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
	this._queryByType = _queryByType;
	this._limitByIdentifier = _limitByIdentifier;
	this._limitByCstrRlat = _limitByCstrRlat;
	this._limitByCstrAttr = _limitByCstrAttr;
	this._queryContainer = _queryContainer;
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
	var testmsg = "";
	this._visitedrecord = [];
	for (var key in this.json) {
		if (key=="account"){
			for (var account in this.json.account){
//				if ($.inArray(account,this._visitedrecord) == -1)
				if(this._visitedrecord.hasItem(account)==false)
				{
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
	// currently not resolving qname
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
						"account" : null,
						"cstrrlat" : [],
						"cstrattr" : []};

//    var arglist = argument.split("<<");
	var arglist = argument;
	for(var i=0;i<arglist.length;i++){
		arglist[i]=arglist[i].removeSurroundingSpace();		
	}
	for(var i=0;i<arglist.length;i++){
		if(arglist[i].indexOf(">>") >= 0){
			var cstr = arglist[i].split(">>");
			if (cstr.length == 3){
				var cstrrlat = {};
				cstrrlat["subject"] = cstr[0];
				cstrrlat["relation"]=cstr[1];
				cstrrlat["object"]=cstr[2];
				parseresult["cstrrlat"].push(cstrrlat);
			}
			else if (cstr.length == 2){
				var cstrattr = {};
				cstrattr["attribute"] = cstr[0];
				cstrattr["value"]=cstr[1];
				parseresult["cstrattr"].push(cstrattr);
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
		querypara = this._parseQueryArgument(argument);
		rtlist = this._queryContainer(querypara);
	}
	return rtlist;
}

function _queryContainer(querypara){
	var rtlist = [];
	this._queriedrecord = [];
	if(querypara.type==null || querypara.type=="record")
		for(var i=0;i<this._provdmterms["record"].length;i++)
			rtlist = rtlist.concat(this._queryByType(this.container,this._provdmterms["record"][i],querypara.account));
	else if(querypara.type == "relation")
		for(var i=0;i<this._provdmterms["relation"].length;i++)
			rtlist = rtlist.concat(this._queryByType(this.container,this._provdmterms["relation"][i],querypara.account));
	else if(querypara.type == "element"){
		for(var i=0;i<this._provdmterms["element"].length;i++){
			rtlist = rtlist.concat(this._queryByType(this.container,this._provdmterms["element"][i],querypara.account));
			}
		}
	else
		rtlist = this._queryByType(this.container,querypara.type);
	
	if(querypara.identifier!=null)
		rtlist = this._limitByIdentifier(rtlist,querypara.identifier);
/*	for (var i=0;i<querypara.cstrrlat.length;i++){
		rtlist = this._limitByCstrRlat(rtlist);
	}
	for (var i=0;i<querypara.cstrattr.length;i++){
		rtlist = this._limitByCstrAttr(rtlist);
	}
	*/
	return rtlist;
}

function _queryByType(container,type,account){
	var rtlist = [];
	test = container;
	if(account==null){
		if(typeof container[type] != "undefined"){
			for(var id in container[type]){
				var item = {};
				item[id] = container[type][id];
				rtlist.push(item);
			}
		}
		if(typeof container["account"] != "undefined")
			for(var acc in container["account"])
				rtlist = rtlist.concat(this._queryByType(container["account"][acc],type,null));
	}
	else{
		if(typeof container["account"] != "undefined"){
			for(var acc in container["account"]){
				if(acc==account){
					rtlist = rtlist.concat(this._queryByType(container["account"][acc],type,null));
				}
				else{
					rtlist = rtlist.concat(this._queryByType(container["account"][acc],type,account));
				}
			}
		}
	}
	return rtlist;
}

function _limitByIdentifier(candidates,identifier){
	var rtlist = [];
	for(var i=0;i<candidates.length;i++){
		for(var id in candidates){
			if(id==identifier){
				rtlist.push(candidates[i]);
			}
		}
	}
	return rtlist;
}

function _limitByCstrRlat(){
	
}

function _limitByCstrAttr(){
	
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