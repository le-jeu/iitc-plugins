export function teamStringToId(teamStr) {
  var team = window.TEAM_NONE;
  if (teamStr === 'ENLIGHTENED') team = window.TEAM_ENL;
  if (teamStr === 'RESISTANCE') team = window.TEAM_RES;
  if (teamStr === 'E') team = window.TEAM_ENL;
  if (teamStr === 'R') team = window.TEAM_RES;
  if (teamStr === 'M') team = window.TEAM_MAC;
  return team;
}
