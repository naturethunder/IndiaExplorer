param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)
& npx.cmd playwright cli $Args

