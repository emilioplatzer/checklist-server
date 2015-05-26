"use strict";

var F_FECHA_HORA='DD-MM-YYYY hh:mm:ss';

var planillas=[];
var planillas_orden=[];
var planillas_momento=[];
traerDeLS();

function indexarPlanilla(planilla){
    planillas_orden[planilla.orden]=planilla;
    planillas_momento[planilla.momento]=planilla;
};

function traerDeLS(){
    planillas=JSON.parse(localStorage['ch.planillas']||'[]');
    for(var i=0; i<planillas.length; i++){
        var planilla=planillas[i];
        indexarPlanilla(planilla);
    }
}

if(typeof moment == "undefined"){
    window.moment={format:function(){ return "moment no instalado";}};
}

function refrescarPlanillas(){
    planillas_div.innerHTML='';
    var div=document.createElement('div');
    var button=document.createElement('button');
    button.textContent='nuevo';
    button.id='nuevo';
    button.onclick=function(){
        mostrarPantallaIngreso();
    }
    div.appendChild(button);
    planillas_div.appendChild(div);
    var div=document.createElement('div');
    var button=document.createElement('button');
    button.textContent='dump';
    button.id='dump';
    button.onclick=function(){
        contenido.innerHTML='';
        contenido.textContent=JSON.stringify(planillas);
    }
    div.appendChild(button);
    planillas_div.appendChild(div);
    for(var i=0; i<planillas.length && i<estructura.maxPlanillasLateral; i++){
        var planilla=planillas[i];
        var div=document.createElement('div');
        var button=document.createElement('button');
        button.textContent=planilla.orden+' '+moment(planilla.ingresado).format(F_FECHA_HORA);
        div.appendChild(button);
        planillas_div.appendChild(div);
    }
}

function mostrarPantallaIngreso(numeroOrden){
    var nuevo=true;
    var vacio=true;
    var planilla={};
    var primerEditable=null;
    if(numeroOrden && !isNaN(numeroOrden)){
        vacio=false;
        var planilla=planillas_orden[numeroOrden];
        if(planilla){
            nuevo=false;
        }else{
            planilla={momento:moment(), orden:Number(numeroOrden)};
            planillas.push(planilla);
            indexarPlanilla(planilla);
        }
        var buttonSave=document.createElement('button');
        buttonSave.dataset.saved=true;
        buttonSave.textContent='grabar';
        buttonSave.id='grabar';
        buttonSave.onclick=function(){
            for(var nombre in estructura.variables){
                planilla[nombre]=referencias[nombre].textContent;
            }
            localStorage['ch.planillas']=JSON.stringify(planillas);
            buttonSave.dataset.saved=true;
        }
    }
    contenido.innerHTML='';
    var table=document.createElement('table');
    var referencias={};
    for(var nombre in estructura.variables){
        var def=estructura.variables[nombre];
        var fila=table.insertRow(-1);
        var cell=fila.insertCell(-1);
        cell.textContent=def.leyenda||nombre;
        if(!(nombre in planilla)){
            planilla[nombre]=null;
        }
        cell=fila.insertCell(-1);
        var editable=!!def.esId===vacio
        cell.contentEditable=editable;
        if(editable && !primerEditable){
            primerEditable=cell;
        }
        cell.dataset.varname=nombre;
        cell.textContent=planilla[nombre];
        cell.id='nueva_'+nombre;
        referencias[nombre]=cell;
        cell.onblur=function(){
            buttonSave.dataset.saved=false;
        }
        cell.onkeydown=enter2tab;
        cell.className='campo';
        if(def.ancho>6){
            cell.colSpan=2;
        }
        if(def.esId && vacio){
            cell=fila.insertCell(-1);
            var button=document.createElement('button');
            button.textContent='ingresar';
            button.onclick=function(){
                mostrarPantallaIngreso(Number(referencias.orden.textContent));
            }
            cell.appendChild(button);
        }
    }
    if(!vacio){
        var row=table.insertRow(-1);
        var cell=row.insertCell(-1);
        cell.colSpan=2;
        var cell=row.insertCell(-1);
        cell.appendChild(buttonSave);
    }
    contenido.appendChild(table);
    if(primerEditable){
        primerEditable.focus();
    }
}

window.addEventListener('load',function(){
    refrescarPlanillas();
});

function enter2tab(e) {
    if (e.which == 13) {
        var row=e.target.parentElement;
        row.parentElement.rows[row.rowIndex+1].cells[e.target.cellIndex].focus();
        e.preventDefault();
    }
}
