<?php

require __DIR__ . '/vendor/autoload.php';

/** @API("ping") */
function ping() {
    return time();
}

/** @API "session" */
function session($args, $server)
{
    $y = intval($server['session']->get('y'));
    $server['session']->set('y', $y+1);
    return $y;
}


/** @API is_prime */
function is_prime($number)
{
    if ($number <= 0) {
        return false;
    }
    $middle = ceil($number/2);
    for ($i = 2; $i <= $middle; ++$i) {
        if ($number % $i === 0) {
            return false;
        }
    }
    return true;
}


$server = new JSONful\Server(__FILE__);
$server->run();
