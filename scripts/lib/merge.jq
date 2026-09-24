# Deep-merge $b onto $a: objects merge recursively, arrays union (a's order, then b's new items),
# and scalars from $b win. Usage: jq -n --slurpfile a A --slurpfile b B -f merge.jq
def umerge($a; $b):
  if ($a | type) == "object" and ($b | type) == "object" then
    reduce ($b | keys_unsorted[]) as $k ($a; .[$k] = umerge($a[$k]; $b[$k]))
  elif ($a | type) == "array" and ($b | type) == "array" then
    $a + [$b[] | select(. as $x | $a | index([$x]) | not)]
  elif $b == null then $a
  else $b
  end;
umerge($a[0]; $b[0])
