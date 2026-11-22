import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Star, ListChecks, RefreshCw, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <Star className="h-5 w-5 text-muted-foreground" />;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
    case 2:
      return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
    case 3:
      return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
    default:
      return "bg-background";
  }
};

export const Leaderboard = ({ autoFetch = true, hideHeader = false }: { autoFetch?: boolean; hideHeader?: boolean } = {}) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTests = async (dateFilter = "") => {
    setTestsLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const url = dateFilter 
        ? `${API_BASE}/leaderboard/tests?date=${dateFilter}`
        : `${API_BASE}/leaderboard/tests`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTests(data.tests || []);
        if (data.tests && data.tests.length > 0) {
          setSelectedTestId(data.tests[0].id.toString());
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tests", err);
    } finally {
      setTestsLoading(false);
    }
  };

  const fetchLeaderboardData = async (testId: string) => {
    if (!testId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('jwt_token');
      const url = `${API_BASE}/leaderboard?test_id=${testId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Results are already sorted by backend: score DESC, time ASC
        const rankedLeaderboard = data.leaderboard.map((student: any, index: number) => ({
          ...student,
          rank: index + 1
        }));
        setLeaderboard(rankedLeaderboard);
      } else {
        setError("Failed to load leaderboard");
      }
    } catch (err) {
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTestId) {
      fetchLeaderboardData(selectedTestId);
    }
  }, [selectedTestId]);

  return (
    <div className={`min-h-screen ${hideHeader ? 'bg-transparent' : 'bg-card-secondary'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="bg-background border-b border-border p-6 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2">Top performers in quiz competitions</p>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto space-y-8 ${hideHeader ? 'pt-2' : 'p-6'}`}>
        {/* Test Selection Card */}
        <Card className="border-gray-100 shadow-sm rounded-2xl bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Select Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Test Name</label>
                <select
                id="test-select"
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                disabled={testsLoading}
              >
                {testsLoading ? (
                  <option>Loading tests...</option>
                ) : tests.length === 0 ? (
                  <option>No tests available</option>
                ) : (
                  <>
                    <option value="">-- Select a test --</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title} {test.date ? `(${new Date(test.date).toLocaleDateString()})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Filter by Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              />
            </div>
          </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
            <div className="text-center text-muted-foreground text-lg">Loading leaderboard rankings...</div>
          </div>
        ) : error ? (
          <div className="text-center p-10 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
            {error}
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-16 text-center">
              <Trophy className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {tests.length === 0 ? "No Tests Attended" : "No Participant Data"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {tests.length === 0
                  ? "You haven't completed any tests yet. Complete a test to see your name on the leaderboard!"
                  : selectedTestId
                    ? "This test has no completed submissions yet. Be the first to top the leaderboard!"
                    : "Please select a test from the dropdown above to view its leaderboard."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-4">
              {/* Arrange for podium visual: 2nd, 1st, 3rd */}
              {[1, 0, 2].map((idx) => {
                const student = leaderboard[idx];
                if (!student) return <div key={`empty-${idx}`} className="hidden md:block" />;

                return (
                  <Card key={student.rank} className={`${getRankStyle(student.rank)} relative overflow-hidden transition-all hover:scale-105 hover:shadow-lg border-2 ${idx === 0 ? 'order-2 md:-mt-6' : idx === 1 ? 'order-1 mt-0' : 'order-3 mt-4'}`}>
                    <CardHeader className="text-center pb-2">
                      <div className="flex justify-center mb-3">
                        <div className={`p-3 rounded-full ${student.rank === 1 ? 'bg-yellow-100' : student.rank === 2 ? 'bg-gray-100' : 'bg-amber-100'}`}>
                          {getRankIcon(student.rank)}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold">#{student.rank}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-background shadow-sm">
                        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                          {student.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg text-foreground truncate">{student.name}</h3>
                      <p className="text-3xl font-black text-primary mt-2">
                        {student.average_score}
                        {student.total_questions && <span className="text-lg text-muted-foreground">/{student.total_questions}</span>}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                        Score
                      </p>
                      {student.time_taken !== null && (
                        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-background/50 border border-border text-sm">
                          <Clock className="h-3 w-3 mr-1.5 text-primary" />
                          <span className="font-medium">{student.time_taken}</span>
                        </div>
                      )}
                      <div className="mt-4 flex flex-col gap-2 items-center">
                        <Badge variant="outline" className="bg-background">
                          {student.department} {student.year && `- ${student.year}`}
                        </Badge>
                        {student.status === 'Missed' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Missed</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Full Leaderboard */}
            <Card className="shadow-lg border-none overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Complete Rankings</CardTitle>
                    <CardDescription>
                      Full rankings for the selected test
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit text-sm py-1.5 px-4 h-fit">
                    {leaderboard.length} Participants
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {leaderboard.map((student) => (
                    <div
                      key={student.rank}
                      className={`flex items-center justify-between p-5 transition-colors hover:bg-muted/50 ${student.rank <= 3 ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-12 h-12">
                          <div className={`flex items-center justify-center font-bold text-lg rounded-full w-10 h-10 ${student.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            student.rank === 2 ? 'bg-gray-100 text-gray-700' :
                              student.rank === 3 ? 'bg-amber-100 text-amber-700' :
                                'text-muted-foreground'
                            }`}>
                            {student.rank <= 3 ? getRankIcon(student.rank) : student.rank}
                          </div>
                        </div>
                        <Avatar className="w-12 h-12 shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {student.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-foreground leading-tight flex items-center gap-2">
                            {student.name}
                            {student.status === 'Missed' && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Missed</Badge>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                              {student.department}
                            </span>
                            {student.year && (
                              <span className="text-xs text-muted-foreground">
                                • {student.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-primary">{student.average_score}</span>
                          <span className="text-xs font-bold text-muted-foreground mt-1">
                            {student.total_questions ? `/ ${student.total_questions}` : '/ 100'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {student.time_taken !== null && (
                            <span className="flex items-center text-xs text-muted-foreground font-medium">
                              <Clock className="h-3 w-3 mr-1" />
                              {student.time_taken}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

