var results = {}

var redB = "rgba(255,0,0,0.4)"
var red = "rgba(255,0,0)"
var yellowB = "rgba(255,255,0,0.4)"
var yellow = "rgba(255,255,0)"
var greenB = "rgba(0,255,0,0.4)"
var green = "rgba(0,255,0)"
var gray = "rgba(200,200,200)"


var type = null
var div = null
var divResId = null
var divChild = null
var nRows = null
var query = null
var queryString = null

var relevance = {
    "-1": {"color": gray, "colorB": gray, "value": "Not annotated"}, 
    "0": {"color": red, "colorB": redB, "value": "Not relevant"}, 
    "1": {"color": yellow, "colorB": yellowB, "value": "Partially relevant"}, 
    "2": {"color": green, "colorB": greenB, "value": "Highly relevant"}
}

var defaultRelevance = -1
var selectedPosition = 0

function changeRelevance(relevanceLocal, id){
    var results = JSON.parse(window.localStorage.getItem('annotations'))
    results[type]["queries"][queryString]["results"][id]["relevance"] = relevanceLocal
    window.localStorage.setItem('annotations', JSON.stringify(results))
    $('[id="' + id + '"]').parent().parent().attr("style", "background-color: " + relevance[relevanceLocal].colorB +" !important;"); 
}


function prepareAnnotator(type, div){
    console.log("prepareAnnotator")

    var storage = window.localStorage.getItem('annotations')
    var results = {"image": {"queries": {}}, "page": {"queries": {}}}
    if (storage)
        results = JSON.parse(storage)

    if (!results[type]["queries"][queryString]){
        results[type]["queries"][queryString] = {}
        results[type]["queries"][queryString]["results"] = {}
    }
    
    $(div).each(function( index ) {
        var position = null
        var id = null
        var metadata = {}
        if (type == 'page'){
            position = parseInt($( this ).attr("data-index")) + parseInt((new URLSearchParams(window.location.search)).get('offset') ?? 0)
            id = $( this ).find("a.overlay-link")[0].href.split("/").slice(6).join('/')
            //console.log($(this))
            //id = $( this )[0].href.split("/").slice(6).join('/')
            metadata["url"] = id.split("/").slice(1).join('/')
            metadata["timestamp"] = id.split("/")[0]
            metadata["position"] = position
            $( this ).find("a.overlay-link").attr("style","height:calc(100% - 100px)");
        } else if (type == 'image'){
            position = parseInt($( this ).attr("data-index")) + parseInt((new URLSearchParams(window.location.search)).get('offset') ?? 0)
            //<li class="image-card" id="image-card-1" data-index="1" data-tstamp="20170624094538" data-url="http://www.primebrands.pt/uploads/marcas/teste/59381b31bfd5d.jpg"> 
            //id = $( "#insert-card-" + position ).find("img").attr("data-src")
            id = $( "#image-card-" + position ).find("img").attr("src")
            metadata["url"] = $(this).attr("data-url");//id.split("/").slice(1).join('/')
            metadata["timestamp"] = $(this).attr("data-timestamp");//id.split("/")[0].substring(0,"20081029060647".length)
            //id = metadata["timestamp"] + '/' + metadata["url"]
            metadata["position"] = position
        }

        var buttonDiv = $(document.createElement('div'))
        $( this ).append(buttonDiv)
        for (var relevanceLocal=0; relevanceLocal < 3; relevanceLocal++){
            var button = document.createElement('input')
            button.type = 'button';
            button.id = position+relevance[relevanceLocal].value;
            button.alt = relevanceLocal
            button.value = relevance[relevanceLocal].value;
            button.style = "height: 70px; margin-top: 10px; width: 33%; background-color: " + relevance[relevanceLocal].colorB
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var relevanceLocal = parseInt($( this ).attr("alt"))
                changeRelevance(relevanceLocal, id)
            }, false);
            buttonDiv.append(button)
        }
        var divId = document.createElement('div')
        divId.id = id
        divId.setAttribute('class', 'ids');

        buttonDiv.append(divId)

        if (!results[type]["queries"][queryString]["results"][id]){
            var relevanceLocal = defaultRelevance
            results[type]["queries"][queryString]["results"][id] = {}
            results[type]["queries"][queryString]["results"][id]["relevance"] = relevanceLocal
            results[type]["queries"][queryString]["results"][id]["metadata"] = metadata
            window.localStorage.setItem('annotations', JSON.stringify(results))
        } else {
            var relevanceLocal = results[type]["queries"][queryString]["results"][id]["relevance"]
        }
        changeRelevance(relevanceLocal, id)
        
    })

    window.localStorage.setItem('annotations', JSON.stringify(results))
}

function toggleRelevance(diff){
    var divId = $($($(divResId).children(divChild)[selectedPosition])[0])
    var id = ""
    if (type == 'page'){
        id = divId.find("a")[0].href.split("/").slice(6).join('/')
    } else if (type == 'image'){
        id = divId.find("img")[0].attr("data-src").split("/").slice(4).join('/')
    }
    var results = JSON.parse(window.localStorage.getItem('annotations'))
    var relevanceLocal = (results[type]["queries"][queryString]["results"][id]["relevance"]+diff)%(Object.keys(relevance).length-1)
    if (relevanceLocal < 0)
        relevanceLocal = Object.keys(relevance).length-2
    changeRelevance(relevanceLocal, id)
}

function turnOffAnnotations(){
    window.localStorage.setItem('annotate', "false");
    window.location.href = window.location.href.replace(/[&\?]annotate=true/,'');
}

function toggleKeyboardNavigation(){
    const annotateKeyboard = (window.localStorage.getItem('annotateKeyboard') == "true")
    window.localStorage.setItem('annotateKeyboard', !annotateKeyboard);
}

function exportAnnotations() {

    var filename = "annotations.json"
    let original = JSON.parse(window.localStorage.getItem('annotations'));
    let output = JSON.parse(window.localStorage.getItem('annotations'));
    if (output?.page?.queries !== undefined){
        output.page.queries = Object.keys(original.page.queries).map(k => {
            let obj = {"query":k, ...original.page.queries[k]}
            obj.results = Object.keys(original.page.queries[k].results).map(id => ({id,...original.page.queries[k].results[id]}))
            return obj;
        }) 
    }
  
    if (output?.image?.queries !== undefined){
        output.image.queries = Object.keys(original.image.queries).map(k => {
            let obj = {"query":k, ...original.image.queries[k]}
            obj.results = Object.keys(original.image.queries[k].results).map(id => ({id,...original.image.queries[k].results[id]}))
            return obj;
        }) 
    }
      
    var text = JSON.stringify(output, null, 2);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

function changePosition(position, childrenCount, nCols){
    if (position < 0){
        position = childrenCount+position
    } else {
        position = position%childrenCount
    }
    
    $($(divResId).children(divChild)[selectedPosition]).css("border-width", "0px");
    selectedPosition = position
    $($(divResId).children(divChild)[selectedPosition]).css("border-width", "5px");
    $($(divResId).children(divChild)[selectedPosition]).css("border-color", "black");

    $($(divResId).children(divChild)[selectedPosition])[0].scrollIntoView(false);
}

function clearAnnotations(){
    if(confirm("Tem a certeza que quer apagar TODAS as anotações feitas até agora, incluindo com outros termos de pesquisa? Considere exportar as anotações antes de apagar.")){
        window.localStorage.removeItem('annotations');
        window.location.reload();
    }
}


$( document ).ready(function() {

    const urlQueryString = window.location.search;
    const urlParams = new URLSearchParams(urlQueryString);
    const annotateQS = urlParams.get('annotate')
    queryString = $("#submit-search-input")[0].value + " " + $("#start-date")[0].value + " " + $("#end-date")[0].value

    if (annotateQS == "true"){
        window.localStorage.setItem('annotate', "true");
    } 

    const annotate = (window.localStorage.getItem('annotate') == "true")
    console.log("ANNOTATE: "+ annotate);
    if (annotate){
        $('#search-form-pages').hide();
        $('#search-form-images').hide();
        $('#search-tools-narrative-button').hide();

        var exportAnnotationsButton = $(document.createElement('a'))
        exportAnnotationsButton.attr("id", "exportAnnotationsButton")
        exportAnnotationsButton.attr("style", "margin-left: -7px;")
        exportAnnotationsButton.attr("href", "#")
        exportAnnotationsButton.attr("onclick", "exportAnnotations()")
        exportAnnotationsButton.html("<button>Exportar anotações</button>")

        var turnOffAnnotationsButton = $(document.createElement('a'))
        turnOffAnnotationsButton.attr("id", "turnOffAnnotationsButton")
        turnOffAnnotationsButton.attr("style", "margin-left:5px")
        turnOffAnnotationsButton.attr("href", "#")
        turnOffAnnotationsButton.attr("onclick", "turnOffAnnotations()")
        turnOffAnnotationsButton.html("<button>Desligar modo anotação</button>")

        var clearAnnotationsButton = $(document.createElement('a'))
        clearAnnotationsButton.attr("id", "clearAnnotationsButton")
        clearAnnotationsButton.attr("style", "margin-left:5px")
        clearAnnotationsButton.attr("href", "#")
        clearAnnotationsButton.attr("onclick", "clearAnnotations()")
        clearAnnotationsButton.html("<button>Limpar anotações</button>")

        const urlqueryString = window.location.search;
        const urlParams = new URLSearchParams(urlqueryString);
        var startValue = urlParams.get('offset')

        if (startValue == null){
            startValue = 0
        } else {
            startValue = parseInt(startValue)
        }
        startValue += 1

        let api = urlParams.get('api');
        if(!!api){
            let apiInput = $(document.createElement('input'));
            apiInput.attr('type','hidden');
            apiInput.attr('name','api');
            apiInput.attr('value',api);
            $('#search-form').append(apiInput);
        }

        var nRes = 0
        if (window.location.href.includes("/image/search")){
            type = "image";
            div = "li.image-card";
            divResId = "image-cards-container";
            divChild = "li.image-card";
            nRows = 3;
            nRes = 24;
        } else if (window.location.href.includes("/page/search")){
            type = "page";
            div = "ul.page-search-result";
            divResId = "#pages-results";
            divChild = "ul";
            nRows = 10;
            nRes = 10;
        }

        var start = $(document.createElement('p'))
        start.attr("id", "startend")
        start.html("<span>" + startValue + " até " + (startValue+nRes-1) + "</span>")
        start.attr("style", "margin-left: 60px; margin-top: 5px;");

        $("#search-tools-buttons").append(exportAnnotationsButton)
        $("#search-tools-buttons").append(turnOffAnnotationsButton)
        $("#search-tools-buttons").append(clearAnnotationsButton)
        $("#search-tools-buttons").append(start)

        var interval = window.setInterval(function(){
            if ($(div).length > 0){
                clearInterval(interval)
                prepareAnnotator(type, div)
            }
        }, 500);

        document.addEventListener('keydown', function(event) {
            if (event.code == 'F1') {
                toggleKeyboardNavigation()
            } else if (window.localStorage.getItem('annotateKeyboard') == "true") {
                var childrenCount = $(divResId).children(divChild).length
                var nCols = Math.ceil(childrenCount/nRows)
                if (event.code == 'KeyW') {
                    changePosition(selectedPosition-nCols, childrenCount, nCols)
                } else if (event.code == 'KeyS') {
                    changePosition(selectedPosition+nCols, childrenCount, nCols)
                } else if (event.code == 'KeyA') {
                    changePosition(selectedPosition-1, childrenCount, nCols)
                } else if (event.code == 'KeyD') {
                    changePosition(selectedPosition+1, childrenCount, nCols)
                } else if (event.code == 'KeyQ') {
                    toggleRelevance(1)
                } else if (event.code == 'KeyE') {
                    toggleRelevance(-1)
                } else if (event.code == 'Digit1') {
                    $(divResId).find(".ids").each(function( index ) {
                        var results = JSON.parse(window.localStorage.getItem('annotations'))
                        if (results[type]["queries"][queryString]["results"][$( this )[0].id]["relevance"] == -1)
                            changeRelevance(0, $( this )[0].id)
                    })
                } else if (event.code == 'Digit2') {
                    $(divResId).find(".ids").each(function( index ) {
                        var results = JSON.parse(window.localStorage.getItem('annotations'))
                        if (results[type]["queries"][queryString]["results"][$( this )[0].id]["relevance"] == -1)
                            changeRelevance(1, $( this )[0].id)
                    })
                } else if (event.code == 'Digit3') {
                    $(divResId).find(".ids").each(function( index ) {
                        var results = JSON.parse(window.localStorage.getItem('annotations'))
                        if (results[type]["queries"][queryString]["results"][$( this )[0].id]["relevance"] == -1)
                            changeRelevance(2, $( this )[0].id)
                    })
                } else if (event.code == 'KeyR') {
                    document.location = $("#nextImage").children()[0].href
                } else if (event.code == 'KeyT') {
                    document.location = $("#previousImage").children()[0].href
                }
            }
        });
    }
})


