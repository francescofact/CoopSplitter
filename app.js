let bill = [];
let last_drop = null;
let people = 2;

let groups = {};
let colors = ["primary", "warning", "success", "danger", "info", "dark"];
let names = "ABCDEF";

$("#runme").click(function(){
  //creating groups
  people = $("#people").val();
  for (let j=0; j<=people; j++){
    groups[names[j]] = []; //creating empty group
    if (j != people-1){
      $("#singles").append('<div class="col-6 dropzone bg-'+colors[j]+' min-h m-0 text-white" data-zone="'+names[j]+'"><b>Prodotti: </b><span>0</span><br><b>Totale: </b>€<span>0.00</span><br><b>Con Gruppo: €</b><span>0.00</span></div>');
    } else {
      $("#group").html('<div class="col-12 dropzone bg-'+colors[j]+' min-h m-0 text-white" data-type="group" data-zone="'+names[j]+'"><b>Prodotti: </b><span>0</span><br><b>Totale: </b>€<span>0.00</span><br><b>Diviso '+people+': </b>€<span>0.00</span></div>')
    }
  }
  //start parsing
  let lines = $("textarea").val().split('\n');
  let lastline = "";
  for(var i = 0;i < lines.length;i++){
    let line = lines[i];
    let end = line.substring(line.length - 2);
    
    if (line.includes("TOTALE COMPLESSIVO"))
      break;
    
    if (end == " A" || end == " B" || end == " D"){
      //its a product
      let name = line.split("      ")[0].trim();
      let price = line.replace(name, "").trim();
      let qta = 1;
      price = price.substring(0, price.length - 2).replace(",",".");
      //check if is a multiple
      let regex = /[0-9]{1,2} {2,3}X[0-9]{1,2},[0-9]{2}/gm;
      if (regex.test(name)){
        name = lastline.trim()
        qta = parseInt(line.trim().split(" ")[0]);
        price = price/qta;
      }

      for (let j=0; j<qta; j++)
        bill.push({"item": name, "price": parseFloat(price)});
      
    } else if (isStrNumeric(end)){
      let widerend = line.substring(line.length - 5)
      if (widerend.includes("-")){
       // last item was in sale
       widerend = widerend.trim().replace("-","").replace(",",'.');

       for (let j=bill.length-1; j>=0; j--){ //apply discount to last item without discount (for qta > 1 with multiple in sale )
          if (bill[j]["discount"] == undefined){
            bill[j]["discount"] = parseFloat(widerend);
            break;
          }
       }
       
      }
    } else {
      lastline = line;
    }
  }
  $("#textdiv").hide();
  $("#dragdiv").fadeIn();
  nextProduct();
})

function isStrNumeric(num){
  if (isNaN(parseInt(num)))
    return false;
  return true;
    
}

function nextProduct(){
    if (bill.length > 0){
        $("#dragdiv").prepend('<div id="yes-drop" class="drag-drop"></div>')
        let obj = $("#yes-drop");
        obj.data(bill[0]);
        let sale = (bill[0].discount !== undefined) ? "<br>Sconto -€"+parseFloat(bill[0].discount).toFixed(2) : "<br>-";
        obj.html("<b>"+bill[0].item+"</b><br>Prezzo: €" + bill[0].price + sale);
        obj.fadeIn();
        bill.shift();
    }
}

function updatePrices(attr, drop){
    let spans = $(drop).find("span");
    let sale = (attr.discount !== undefined) ? parseFloat(attr.discount) : 0;
    let total = parseFloat(attr.price) - sale;
    spans.eq(0).html((parseInt(spans.eq(0).text()) + 1));
    spans.eq(1).html((parseFloat(spans.eq(1).text()) + total).toFixed(2));

    if (drop.data("type") == "group"){
      //is group zone
      spans.eq(2).html((parseFloat(spans.eq(1).text())/people).toFixed(2));
      let total_splitted = parseFloat($(".dropzone").last().children().last().text())
      updateWithGroups(total_splitted);
    } else {
      //it's individual zone
      let total_splitted = parseFloat($(".dropzone").last().children().last().text())
      spans.eq(2).html((parseFloat(spans.eq(1).text())+total_splitted).toFixed(2));
    }
}

function updateWithGroups(total){
  let boxes = $(".dropzone")
  boxes.each(function(i){
    let box = boxes.eq(i);
    if (box.data("type") != "group"){
      let spans = box.find("span");
      let current_total = parseFloat(spans.eq(1).text());
      console.log("GROUP " + box.data("zone") + " ha speso " + current_total + " e devo aggiungere " + total)
      spans.eq(2).text(current_total+total);
    }
  })
}

// enable draggables to be dropped into this
interact('.dropzone').dropzone({
    // only accept elements matching this CSS selector
    accept: '#yes-drop',
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    // listen for drop related events:

    ondropactivate: function (event) {
        // add active dropzone feedback
        event.target.classList.add('drop-active')
    },
    ondragenter: function (event) {
        var draggableElement = event.relatedTarget
        var dropzoneElement = event.target

        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target')
        draggableElement.classList.add('can-drop')
    },
    ondragleave: function (event) {
        // remove the drop feedback style
        event.target.classList.remove('drop-target')
        event.relatedTarget.classList.remove('can-drop')
    },
    ondrop: function (event) {
        let obj = $(event.relatedTarget);
        let drop = $(event.target);

        last_drop = obj;
        let { x, y, ...attr } = obj.data();

        groups[drop.data("zone")].push(attr);
        obj.remove();
        updatePrices(attr, drop);
        nextProduct();
    },
    ondropdeactivate: function (event) {
        // remove active dropzone feedback
        event.target.classList.remove('drop-active')
        event.target.classList.remove('drop-target')
    }
})
  
interact('.drag-drop').draggable({
    inertia: true,
    modifiers: [
    interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
    })
    ],
    autoScroll: true,
    // dragMoveListener from the dragging demo above
    listeners: { move: dragMoveListener }
})

function dragMoveListener (event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
        'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

//plus-minus
$(document).ready(function() {
  $('.minus').click(function () {
    var $input = $(this).parent().find('input');
    var count = parseInt($input.val()) - 1;
    count = count < 2 ? 2 : count;
    $input.val(count);
    $input.change();
    return false;
  });
  $('.plus').click(function () {
    var $input = $(this).parent().find('input');
    var count = parseInt($input.val()) + 1;
    count = count > 5 ? 5 : count;
    $input.val(count);
    $input.change();
    return false;
  });
});