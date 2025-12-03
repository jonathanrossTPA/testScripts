[Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\Git\bin;C:\Program Files\Git\cmd",
  [EnvironmentVariableTarget]::User
)