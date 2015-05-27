"use strict";

var F_FECHA_HORA='DD/MM hh:mm:ss';

var guardar={};
var planillas=[];
var planillas_orden=[];
var planillas_momento=[];
traerDeLS();

function indexarPlanilla(planilla){
    planillas_orden[planilla.orden]=planilla;
    var idxMomento=planilla.momento+' i '+planilla.orden;
    planillas_momento[idxMomento]=planilla;
};

function traerDeLS(){
    guardar=localStorage['ch.guardar'];
    guardar=guardar?JSON.parse(guardar):{planillas:[]};
    planillas=guardar.planillas;
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
        mostrarPantallaIngreso(null,true);
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
    var div=document.createElement('div');
    var button=document.createElement('button');
    if(!"con boton demo"){
        button.textContent='DEMO';
        button.id='demo';
        button.onclick=function(){
            for(var i=5000; i<9999; i++){
                if(!(i in planillas)){
                    var planilla={orden:i, momento:moment().subtract(i,'seconds')};
                    for(var nombre in estructura.variables){
                        var def=estructura.variables[nombre];
                        planilla[nombre]=nombre=='orden'?i:Math.floor(Math.random()*(Math.pow(10,def.ancho)));
                    }
                    planillas.push(planilla);
                    indexarPlanilla(planilla);
                }
            }
            refrescarPlanillas();
        }
        div.appendChild(button);
        planillas_div.appendChild(div);
    }
    item_cantidad.textContent=planillas.length+' planillas'; 
    var momentos_planilla=Object.keys(planillas_momento);
    momentos_planilla.sort();
    momentos_planilla.reverse();
    for(var i=0; i<momentos_planilla.length; i++){
        var planilla=planillas_momento[momentos_planilla[i]];
        if(i<estructura.maxPlanillasLateral){
            var div=document.createElement('div');
            var button=document.createElement('button');
            button.textContent=planilla.orden+' '+moment(planilla.momento).format(F_FECHA_HORA);
            button.dataset.sucia = !!planilla.sucia;
            button.onclick=(function(orden){
                return function(){
                    mostrarPantallaIngreso(orden,false);
                };
            })(planilla.orden);
            div.appendChild(button);
            planillas_div.appendChild(div);
        }
    }
}

function ajaxSimple(params){
    var ajax = new XMLHttpRequest();
    params.onerror=params.onerror||function(err){ alert(err); };
    ajax.open(params.method||'get',params.url);
    ajax.onload=function(e){
        if(ajax.status!=200){
            params.onerror(new Error(ajax.status+' '+ajax.responseText));
        }else{
            try{
                params.onload.call(null,ajax.responseText);
            }catch(err){
                params.onerror(err);
            }
        }
    }
    ajax.onerror=params.onerror;
    ajax.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    var enviar=Object.keys(params.data).map(function(key){
        return key+'='+encodeURIComponent(params.data[key]);
    }).join('&');
    ajax.send(enviar);
}

function sincronizarConElServidor(){
    item_status.textContent='sincronizando...';
    setTimeout(function(){
        var planillasAEnviar=planillas.filter(function(planilla){
            return planilla.sucia;
        });
        ajaxSimple({
            method:'POST',
            url:'./syncro/put',
            data:{planillas:JSON.stringify(planillasAEnviar)},
            onload:function(data){
                item_status.textContent='actualizado '+data;
                planillasAEnviar.forEach(function(planilla){
                    planilla.sucia=false;
                });
                refrescarPlanillas();
            },
            onerror:function(err){
                item_status.textContent='error';
                item_status.title=err+'';
            },
        });
    },0);
}

function mostrarPantallaIngreso(numeroOrden,doFocus){
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
            planilla.sucia=true;
            item_status.textContent='saving';
            buttonSave.disabled=true;
            setTimeout(function(){
                for(var nombre in estructura.variables){
                    planilla[nombre]=referencias[nombre].textContent;
                }
                localStorage['ch.guardar']=JSON.stringify(guardar);
                buttonSave.dataset.saved=true;
                item_status.textContent='ok';
                buttonSave.enabled=true;
                refrescarPlanillas();
                item_status.textContent='sincronizando';
                setTimeout(function(){
                    sincronizarConElServidor();
                },0);
            },0);
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
                mostrarPantallaIngreso(Number(referencias.orden.textContent),true);
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
    if(primerEditable && doFocus){
        primerEditable.focus();
    }
}

window.addEventListener('load',function(){
    refrescarPlanillas();
    var button=document.createElement('button');
    button.id='sincronizar';
    button.textContent='sincronizar';
    button.onclick=sincronizarConElServidor;
    item_sincronizar.appendChild(button);
});

function enter2tab(e) {
    if (e.which == 13) {
        var row=e.target.parentElement;
        row.parentElement.rows[row.rowIndex+1].cells[e.target.cellIndex].focus();
        e.preventDefault();
    }
}
