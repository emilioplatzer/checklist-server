<?php

$host = 'nuestroservidor.com.ar';
$port = '62432';
$cron = true; // true; // Set $cron = false to Stop cron

if(@$_SERVER['SERVER_PORT'] > 1){
    die('Not accesible via the web !');
}

if($cron == true){
    $checkconn = @fsockopen($host, $port, $errno, $errstr, 5);
    if(empty($checkconn)){
        echo "Lanzar, no esta";
        exec('export HOME=/home/nuestros/programas/checklist-server; cd /home/nuestros/programas/checklist-server; /home/nuestros/nodejs-g/bin/npm start --production >> /home/nuestros/logs/checklist-server.log 2>&1 &', $out, $ret);
    }else{
        echo "Ya esta andando";
    }
}else{
    echo "cortar con kill";
    exec('ps -aux >> /home/nuestros/logs/ps.log 2>&1 &', $out, $ret);
    exec('kill -9 841774', $out, $ret);
}

?>
