import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { supabase } from "./supabase";

// ============================================================
// DATA
// ============================================================

const ACTIVITY_TASKS = [
  "Bathroom",
  "Kitchen",
  "Sweeping",
  "Mats",
];

const TRASH_DAYS = [
  "Wednesday",
  "Sunday",
];

// ============================================================
// DARK THEME
// ============================================================

const COLORS = {
  background: "#0D0F12",
  card: "#17191D",
  cardSecondary: "#1C1F24",

  text: "#F5F7FA",
  secondary: "#969CA8",

  dark: "#F5F7FA",
  darkText: "#111827",

  light: "#22252B",

  border: "#2D3138",

  success: "#B5BEC9",

  input: "#181B20",

  glass: "rgba(255,255,255,0.065)",
  glassActive: "rgba(255,255,255,0.14)",

  glassBorder:
    "rgba(255,255,255,0.10)",

  glassActiveBorder:
    "rgba(255,255,255,0.16)",
};

// ============================================================
// DATE HELPERS
// ============================================================

function getWeekStart(
  date = new Date()
) {
  const d = new Date(date);

  const day = d.getDay();

  // Monday = beginning of HomeHub week
  const difference =
    day === 0
      ? -6
      : 1 - day;

  d.setDate(
    d.getDate() + difference
  );

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d
    .toISOString()
    .split("T")[0];
}

function getPreviousWeekStart(
  weeksAgo
) {
  const currentWeek =
    getWeekStart();

  const d = new Date(
    `${currentWeek}T00:00:00`
  );

  d.setDate(
    d.getDate() -
      weeksAgo * 7
  );

  return d
    .toISOString()
    .split("T")[0];
}

function formatWeek(
  startDate
) {
  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(start);

  end.setDate(
    end.getDate() + 6
  );

  const startText =
    start.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );

  const endText =
    end.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  return `${startText} – ${endText}`;
}

// ============================================================
// INVITE CODE
// ============================================================

function generateInviteCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (
    let i = 0;
    i < 6;
    i++
  ) {
    code +=
      characters[
        Math.floor(
          Math.random() *
            characters.length
        )
      ];
  }

  return code;
}

// ============================================================
// AUTH SCREEN
// ============================================================

function AuthScreen({
  onAuthenticated,
}) {
  const [mode, setMode] =
    useState("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );

      return;
    }

    if (
      mode === "signup" &&
      !name.trim()
    ) {
      Alert.alert(
        "Missing name",
        "Please enter your name."
      );

      return;
    }

    if (
      password.length < 6
    ) {
      Alert.alert(
        "Password too short",
        "Password must be at least 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      if (
        mode === "signup"
      ) {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp(
            {
              email:
                cleanEmail,

              password,

              options: {
                data: {
                  name:
                    name.trim(),
                },
              },
            }
          );

        if (error) {
          throw error;
        }

        if (data.session) {
          onAuthenticated(
            data.session.user
          );
        } else {
          Alert.alert(
            "Account created",
            "Your account was created. If email confirmation is enabled, confirm your email and then log in."
          );

          setMode("login");
          setPassword("");
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                cleanEmail,

              password,
            }
          );

        if (error) {
          throw error;
        }

        onAuthenticated(
          data.user
        );
      }
    } catch (error) {
      Alert.alert(
        mode === "signup"
          ? "Account creation failed"
          : "Login failed",
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.loginSafeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.authContainer
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.authCard,

              Platform.OS === "web" &&
                styles.authCardWeb,
            ]}
          >
            <Text
              style={styles.loginLogo}
            >
              HomeHub
            </Text>

            <Text
              style={
                styles.loginSubtitle
              }
            >
              Your shared house task manager
            </Text>

            {mode ===
              "signup" && (
              <>
                <Text
                  style={
                    styles.loginInputLabel
                  }
                >
                  Name
                </Text>

                <TextInput
                  style={
                    styles.loginInput
                  }
                  placeholder="Your name"
                  placeholderTextColor="#9AA0AA"
                  value={name}
                  onChangeText={
                    setName
                  }
                  autoCapitalize="words"
                />
              </>
            )}

            <Text
              style={
                styles.loginInputLabel
              }
            >
              Email
            </Text>

            <TextInput
              style={
                styles.loginInput
              }
              placeholder="Email address"
              placeholderTextColor="#9AA0AA"
              value={email}
              onChangeText={
                setEmail
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text
              style={
                styles.loginInputLabel
              }
            >
              Password
            </Text>

            <TextInput
              style={
                styles.loginInput
              }
              placeholder="Password"
              placeholderTextColor="#9AA0AA"
              value={password}
              onChangeText={
                setPassword
              }
              secureTextEntry
            />

            <Pressable
              style={
                styles.loginButton
              }
              onPress={
                handleSubmit
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  {mode === "login"
                    ? "Log in"
                    : "Create Account"}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={
                styles.switchAuthButton
              }
              onPress={() => {
                setMode(
                  mode === "login"
                    ? "signup"
                    : "login"
                );

                setPassword("");
              }}
            >
              <Text
                style={
                  styles.switchAuthText
                }
              >
                {mode === "login"
                  ? "Don't have an account? Create Account"
                  : "Already have an account? Log in"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// HOUSE SETUP
// ============================================================

function HouseSetup({
  user,
  onHouseReady,
}) {
  const [mode, setMode] =
    useState("choose");

  const [
    houseName,
    setHouseName,
  ] = useState("");

  const [
    inviteCode,
    setInviteCode,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function createHouse() {
    if (!houseName.trim()) {
      Alert.alert(
        "Enter house name",
        "Please enter a name for your house."
      );

      return;
    }

    setLoading(true);

    try {
      const code =
        generateInviteCode();

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "create_house",
          {
            house_name:
              houseName.trim(),

            code,
          }
        );

      if (error) {
        throw error;
      }

      Alert.alert(
        "House created!",
        `Your house invite code is:\n\n${code}\n\nShare this code with your housemates.`,
        [
          {
            text: "Continue",

            onPress: () =>
              onHouseReady(
                data
              ),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Could not create house",
        error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinHouse() {
    const code =
      inviteCode
        .trim()
        .toUpperCase();

    if (!code) {
      Alert.alert(
        "Enter invite code",
        "Please enter your house invite code."
      );

      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "join_house",
          {
            code,
          }
        );

      if (error) {
        throw error;
      }

      onHouseReady(
        data
      );
    } catch (error) {
      Alert.alert(
        "Could not join house",
        error.message ||
          "Please check the invite code."
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    mode === "choose"
  ) {
    return (
      <SafeAreaView
        style={
          styles.darkSafeArea
        }
      >
        <View
          style={
            styles.houseContainer
          }
        >
          <Text
            style={
              styles.logo
            }
          >
            HomeHub
          </Text>

          <Text
            style={
              styles.houseWelcome
            }
          >
            Welcome,{" "}
            {user.user_metadata
              ?.name ||
              "User"}
            !
          </Text>

          <Text
            style={
              styles.houseSubtitle
            }
          >
            Create a house or join your
            existing house.
          </Text>

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={() =>
              setMode(
                "create"
              )
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Create House
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setMode("join")
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Join House
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (
    mode === "create"
  ) {
    return (
      <SafeAreaView
        style={
          styles.darkSafeArea
        }
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View
            style={
              styles.houseContainer
            }
          >
            <Pressable
              onPress={() =>
                setMode(
                  "choose"
                )
              }
            >
              <Text
                style={
                  styles.backText
                }
              >
                ‹ Back
              </Text>
            </Pressable>

            <Text
              style={
                styles.pageTitle
              }
            >
              Create House
            </Text>

            <Text
              style={
                styles.inputLabel
              }
            >
              House name
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Example: 1922 Unit 3"
              placeholderTextColor={
                COLORS.secondary
              }
              value={houseName}
              onChangeText={
                setHouseName
              }
              autoCapitalize="words"
            />

            <Pressable
              style={
                styles.primaryButton
              }
              onPress={
                createHouse
              }
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#111827"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Create House
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.darkSafeArea
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.houseContainer
          }
        >
          <Pressable
            onPress={() =>
              setMode("choose")
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Back
            </Text>
          </Pressable>

          <Text
            style={
              styles.pageTitle
            }
          >
            Join House
          </Text>

          <Text
            style={
              styles.inputLabel
            }
          >
            Invite code
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Example: A7K92P"
            placeholderTextColor={
              COLORS.secondary
            }
            value={inviteCode}
            onChangeText={
              setInviteCode
            }
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={
              joinHouse
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#111827"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Join House
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// LIQUID GLASS NAVIGATION
// ============================================================

function TopNavigation({
  page,
  setPage,
}) {
  const { width } =
    useWindowDimensions();

  const animation =
    useRef(
      new Animated.Value(page)
    ).current;

  const items = [
    "Activities",
    "Trash",
    "History",
  ];

  useEffect(() => {
    Animated.spring(animation, {
      toValue: page,

      damping: 22,
      stiffness: 180,
      mass: 0.7,

      useNativeDriver: true,
    }).start();
  }, [page]);

  // On web the navigation/content
  // share exactly the same max width.
  const totalWidth =
    Platform.OS === "web"
      ? Math.min(
          Math.max(
            width - 32,
            300
          ),
          570
        )
      : Math.max(
          width - 28,
          300
        );

  const tabWidth =
    (totalWidth - 8) / 3;

  const indicatorWidth =
    tabWidth - 4;

  const translateX =
    animation.interpolate({
      inputRange: [
        0,
        1,
        2,
      ],

      outputRange: [
        4,
        tabWidth + 4,
        tabWidth * 2 + 4,
      ],
    });

  return (
    <View
      style={[
        styles.liquidNavigation,

        {
          width:
            totalWidth,

          backgroundColor:
            COLORS.glass,

          borderColor:
            COLORS.glassBorder,
        },
      ]}
    >
      {/* MOVING GLASS CAPSULE */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.liquidActivePill,

          {
            width:
              indicatorWidth,

            transform: [
              {
                translateX,
              },
            ],

            backgroundColor:
              COLORS.glassActive,

            borderColor:
              COLORS.glassActiveBorder,
          },
        ]}
      />

      {items.map(
        (
          item,
          index
        ) => (
          <Pressable
            key={item}
            style={[
              styles.liquidNavigationItem,

              {
                width:
                  tabWidth,
              },
            ]}
            onPress={() =>
              setPage(index)
            }
          >
            <Text
              style={[
                styles.liquidNavigationText,

                {
                  color:
                    page ===
                    index
                      ? "#FFFFFF"
                      : "#969CA8",
                },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
}

// ============================================================
// COMPLETION CARD
// ============================================================

function CompletionCard({
  title,
  completion,
  onDone,
  onUndo,
  loading,
}) {
  const completed =
    !!completion;

  return (
    <View
      style={
        styles.taskCard
      }
    >
      <View
        style={
          styles.taskInfo
        }
      >
        <Text
          style={
            styles.taskTitle
          }
        >
          {title}
        </Text>

        {completed ? (
          <Text
            style={
              styles.completedText
            }
          >
            ✓ Completed —{" "}
            {completion.completedByName ||
              "User"}
          </Text>
        ) : (
          <Text
            style={
              styles.notCompletedText
            }
          >
            Not completed
          </Text>
        )}
      </View>

      <Pressable
        style={[
          styles.taskButton,

          completed &&
            styles.undoButton,
        ]}
        onPress={
          completed
            ? onUndo
            : onDone
        }
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color={
              completed
                ? COLORS.secondary
                : COLORS.darkText
            }
          />
        ) : (
          <Text
            style={[
              styles.taskButtonText,

              completed &&
                styles.undoButtonText,
            ]}
          >
            {completed
              ? "Undo"
              : "Done"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ============================================================
// ACTIVITIES PAGE
// ============================================================

function ActivitiesPage({
  completions,
  onDone,
  onUndo,
  actionLoading,
}) {
  return (
    <ScrollView
      style={
        styles.page
      }
      contentContainerStyle={
        styles.pageContent
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        House Activities
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        This week's tasks
      </Text>

      <View
        style={
          styles.taskList
        }
      >
        {ACTIVITY_TASKS.map(
          (task) => {
            const key =
              `activities-${task}-Any`;

            const completion =
              completions[key];

            return (
              <CompletionCard
                key={task}
                title={task}
                completion={
                  completion
                }
                onDone={() =>
                  onDone(
                    "activities",
                    task,
                    "Any"
                  )
                }
                onUndo={() =>
                  onUndo(
                    completion
                  )
                }
                loading={
                  actionLoading ===
                  (
                    completion?.id ||
                    key
                  )
                }
              />
            );
          }
        )}
      </View>
    </ScrollView>
  );
}

// ============================================================
// TRASH PAGE
// ============================================================

function TrashPage({
  completions,
  onDone,
  onUndo,
  actionLoading,
}) {
  return (
    <ScrollView
      style={
        styles.page
      }
      contentContainerStyle={
        styles.pageContent
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        Trash
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        Take out the trash every
        Wednesday and Sunday
      </Text>

      <View
        style={
          styles.taskList
        }
      >
        {TRASH_DAYS.map(
          (day) => {
            const taskName =
              `${day} Trash`;

            const key =
              `trash-${taskName}-${day}`;

            const completion =
              completions[key];

            return (
              <CompletionCard
                key={day}
                title={
                  taskName
                }
                completion={
                  completion
                }
                onDone={() =>
                  onDone(
                    "trash",
                    taskName,
                    day
                  )
                }
                onUndo={() =>
                  onUndo(
                    completion
                  )
                }
                loading={
                  actionLoading ===
                  (
                    completion?.id ||
                    key
                  )
                }
              />
            );
          }
        )}
      </View>
    </ScrollView>
  );
}

// ============================================================
// HISTORY PAGE
// ============================================================

function HistoryPage({
  history,
  historyMode,
  setHistoryMode,
}) {
  const weeks =
    Object.keys(
      history
    ).sort(
      (a, b) =>
        b.localeCompare(a)
    );

  return (
    <ScrollView
      style={
        styles.page
      }
      contentContainerStyle={
        styles.pageContent
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        Weekly History
      </Text>

      <Text
        style={
          styles.sectionSubtitle
        }
      >
        See who completed each task
      </Text>

      <View
        style={
          styles.historyToggle
        }
      >
        <Pressable
          style={[
            styles.historyToggleButton,

            historyMode ===
              "activities" &&
              styles.historyToggleButtonActive,
          ]}
          onPress={() =>
            setHistoryMode(
              "activities"
            )
          }
        >
          <Text
            style={[
              styles.historyToggleText,

              historyMode ===
                "activities" &&
                styles.historyToggleTextActive,
            ]}
          >
            Activities
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.historyToggleButton,

            historyMode ===
              "trash" &&
              styles.historyToggleButtonActive,
          ]}
          onPress={() =>
            setHistoryMode(
              "trash"
            )
          }
        >
          <Text
            style={[
              styles.historyToggleText,

              historyMode ===
                "trash" &&
                styles.historyToggleTextActive,
            ]}
          >
            Trash
          </Text>
        </Pressable>
      </View>

      {weeks.length ===
      0 ? (
        <View
          style={
            styles.emptyHistory
          }
        >
          <Text
            style={
              styles.emptyHistoryText
            }
          >
            No history yet.
          </Text>
        </View>
      ) : (
        weeks.map(
          (
            weekStart
          ) => {
            const records =
              history[
                weekStart
              ] || [];

            return (
              <View
                key={
                  weekStart
                }
                style={
                  styles.historyWeek
                }
              >
                <Text
                  style={
                    styles.historyWeekTitle
                  }
                >
                  {formatWeek(
                    weekStart
                  )}
                </Text>

                {historyMode ===
                "activities"
                  ? ACTIVITY_TASKS.map(
                      (
                        task
                      ) => {
                        const record =
                          records.find(
                            (
                              item
                            ) =>
                              item.category ===
                                "activities" &&
                              item.task_name ===
                                task &&
                              (
                                item.scheduled_day ===
                                  "Any" ||
                                item.scheduled_day ===
                                  null
                              )
                          );

                        return (
                          <HistoryRow
                            key={
                              task
                            }
                            title={
                              task
                            }
                            record={
                              record
                            }
                          />
                        );
                      }
                    )
                  : TRASH_DAYS.map(
                      (
                        day
                      ) => {
                        const record =
                          records.find(
                            (
                              item
                            ) =>
                              item.category ===
                                "trash" &&
                              item.task_name ===
                                `${day} Trash` &&
                              item.scheduled_day ===
                                day
                          );

                        return (
                          <HistoryRow
                            key={
                              day
                            }
                            title={`${day} Trash`}
                            record={
                              record
                            }
                          />
                        );
                      }
                    )}
              </View>
            );
          }
        )
      )}
    </ScrollView>
  );
}

// ============================================================
// HISTORY ROW
// ============================================================

function HistoryRow({
  title,
  record,
}) {
  return (
    <View
      style={
        styles.historyRow
      }
    >
      <Text
        style={
          styles.historyTask
        }
      >
        {title}
      </Text>

      <Text
        style={[
          styles.historyPerson,

          !record &&
            styles.historyNotDone,
        ]}
      >
        {record
          ? `✓ ${
              record.completedByName ||
              "User"
            }`
          : "Not done"}
      </Text>
    </View>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================

function HomeScreen({
  user,
  houseId,
  houseName,
  onLogout,
}) {
  const {
    width,
  } =
    useWindowDimensions();

  const pagerRef =
    useRef(null);

  const [page, setPage] =
    useState(0);

  const [
    completions,
    setCompletions,
  ] = useState({});

  const [history, setHistory] =
    useState({});

  const [
    historyMode,
    setHistoryMode,
  ] = useState(
    "activities"
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState(null);

  const [
    profileName,
    setProfileName,
  ] = useState(
    user.user_metadata
      ?.name ||
      "User"
  );

  const weekStart =
    useMemo(
      () =>
        getWeekStart(),
      []
    );

  // ==========================================================
  // WEB CONTENT WIDTH
  // ==========================================================

  /*
    On web:
      navigation width = content width

    On mobile:
      content uses full screen width
  */

  const contentWidth =
    Platform.OS === "web"
      ? Math.min(
          Math.max(
            width - 32,
            300
          ),
          570
        )
      : width;

  // ==========================================================
  // LOAD PROFILE NAME
  // ==========================================================

  async function loadProfileName() {
    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, name"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      !error &&
      data?.name
    ) {
      setProfileName(
        data.name
      );
    } else if (
      user.user_metadata
        ?.name
    ) {
      setProfileName(
        user.user_metadata
          .name
      );
    }
  }

  // ==========================================================
  // GET PROFILE NAMES
  // ==========================================================

  async function getProfileNames(
    records
  ) {
    const ids = [
      ...new Set(
        records
          .map(
            (
              item
            ) =>
              item.completed_by
          )
          .filter(Boolean)
      ),
    ];

    if (
      ids.length ===
      0
    ) {
      return {};
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, name"
        )
        .in(
          "id",
          ids
        );

    if (error) {
      console.log(
        "Profile names error:",
        error
      );

      return {};
    }

    const names = {};

    (
      data || []
    ).forEach(
      (
        profile
      ) => {
        names[
          profile.id
        ] =
          profile.name;
      }
    );

    return names;
  }

  // ==========================================================
  // LOAD CURRENT WEEK
  // ==========================================================

  async function loadCurrentWeek() {
    if (!houseId) {
      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("completions")
        .select("*")
        .eq(
          "house_id",
          houseId
        )
        .eq(
          "week_start",
          weekStart
        );

    if (error) {
      console.log(
        "Current week error:",
        error
      );

      return;
    }

    const names =
      await getProfileNames(
        data || []
      );

    const result = {};

    (
      data || []
    ).forEach(
      (
        item
      ) => {
        const day =
          item.scheduled_day ||
          "Any";

        const key =
          `${item.category}-${item.task_name}-${day}`;

        result[key] = {
          ...item,

          completedByName:
            names[
              item.completed_by
            ] ||
            (
              item.completed_by ===
              user.id
                ? profileName
                : null
            ) ||
            "User",
        };
      }
    );

    setCompletions(
      result
    );
  }

  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  async function loadHistory() {
    if (!houseId) {
      return;
    }

    const oldestWeek =
      getPreviousWeekStart(
        7
      );

    const {
      data,
      error,
    } =
      await supabase
        .from("completions")
        .select("*")
        .eq(
          "house_id",
          houseId
        )
        .gte(
          "week_start",
          oldestWeek
        )
        .order(
          "week_start",
          {
            ascending:
              false,
          }
        );

    if (error) {
      console.log(
        "History error:",
        error
      );

      return;
    }

    const names =
      await getProfileNames(
        data || []
      );

    const result = {};

    // Always show current week.
    result[
      weekStart
    ] = [];

    (
      data || []
    ).forEach(
      (
        item
      ) => {
        if (
          !result[
            item.week_start
          ]
        ) {
          result[
            item.week_start
          ] = [];
        }

        result[
          item.week_start
        ].push({
          ...item,

          completedByName:
            names[
              item.completed_by
            ] ||
            (
              item.completed_by ===
              user.id
                ? profileName
                : null
            ) ||
            "User",
        });
      }
    );

    setHistory(
      result
    );
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadProfileName();
    loadCurrentWeek();
    loadHistory();
  }, [houseId]);

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(() => {
    if (!houseId) {
      return;
    }

    console.log(
      "Starting HomeHub realtime:",
      houseId
    );

    const channel =
      supabase
        .channel(
          `homehub-house-${houseId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "completions",
            filter:
              `house_id=eq.${houseId}`,
          },
          async (
            payload
          ) => {
            console.log(
              "HomeHub realtime update:",
              payload.eventType
            );

            await loadCurrentWeek();
            await loadHistory();
          }
        )
        .subscribe(
          (
            status
          ) => {
            console.log(
              "Realtime status:",
              status
            );
          }
        );

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    houseId,
    weekStart,
  ]);

  // ==========================================================
  // COMPLETE TASK
  // ==========================================================

  async function completeTask(
    category,
    taskName,
    scheduledDay
  ) {
    if (
      !user ||
      !houseId
    ) {
      return;
    }

    const key =
      `${category}-${taskName}-${scheduledDay}`;

    setActionLoading(
      key
    );

    try {
      console.log(
        "Completing:",
        category,
        taskName,
        scheduledDay,
        user.id,
        profileName
      );

      const {
        error,
      } =
        await supabase
          .from("completions")
          .upsert(
            {
              house_id:
                houseId,

              week_start:
                weekStart,

              category,

              task_name:
                taskName,

              scheduled_day:
                scheduledDay,

              completed_by:
                user.id,

              completed_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "house_id,week_start,category,task_name,scheduled_day",
            }
          );

      if (error) {
        throw error;
      }

      await loadCurrentWeek();
      await loadHistory();
    } catch (error) {
      console.log(
        "Complete task error:",
        error
      );

      Alert.alert(
        "Could not complete task",
        error.message ||
          "Something went wrong."
      );
    } finally {
      setActionLoading(
        null
      );
    }
  }

  // ==========================================================
  // UNDO TASK
  // ==========================================================

  async function undoTask(
    completion
  ) {
    if (!houseId) {
      return;
    }

    if (
      !completion?.id
    ) {
      console.log(
        "UNDO FAILED: completion has no ID",
        completion
      );

      Alert.alert(
        "Cannot undo",
        "This completion does not have a database ID."
      );

      return;
    }

    const completionId =
      completion.id;

    setActionLoading(
      completionId
    );

    console.log(
      "UNDO START:",
      completion
    );

    try {
      // ------------------------------------------------------
      // DELETE EXACT DATABASE ROW
      // ------------------------------------------------------

      const {
        data,
        error,
      } =
        await supabase
          .from("completions")
          .delete()
          .eq(
            "id",
            completionId
          )
          .eq(
            "house_id",
            houseId
          )
          .select();

      if (error) {
        throw error;
      }

      console.log(
        "UNDO DELETE RESULT:",
        data
      );

      // ------------------------------------------------------
      // REMOVE FROM CURRENT WEEK
      // ------------------------------------------------------

      setCompletions(
        (previous) => {
          const updated = {
            ...previous,
          };

          const day =
            completion.scheduled_day ||
            "Any";

          const key =
            `${completion.category}-${completion.task_name}-${day}`;

          delete updated[key];

          return updated;
        }
      );

      // ------------------------------------------------------
      // REMOVE FROM HISTORY
      // ------------------------------------------------------

      setHistory(
        (previous) => {
          const updated = {};

          Object.keys(
            previous
          ).forEach(
            (
              week
            ) => {
              const records =
                previous[
                  week
                ] || [];

              updated[
                week
              ] =
                records.filter(
                  (
                    record
                  ) =>
                    record.id !==
                    completionId
                );
            }
          );

          return updated;
        }
      );

      // ------------------------------------------------------
      // REFRESH DATABASE STATE
      // ------------------------------------------------------

      await new Promise(
        (
          resolve
        ) =>
          setTimeout(
            resolve,
            150
          )
      );

      await loadCurrentWeek();
      await loadHistory();

      console.log(
        "UNDO COMPLETE:",
        completionId
      );
    } catch (error) {
      console.log(
        "UNDO ERROR:",
        error
      );

      Alert.alert(
        "Could not undo task",
        error.message ||
          "Something went wrong."
      );

      await loadCurrentWeek();
      await loadHistory();
    } finally {
      setActionLoading(
        null
      );
    }
  }

  // ==========================================================
  // LOG OUT
  // ==========================================================

  async function logout() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        "Logout failed",
        error.message
      );
    } else {
      onLogout();
    }
  }

  // ==========================================================
  // GO TO PAGE
  // ==========================================================

  function goToPage(
    newPage
  ) {
    setPage(
      newPage
    );

    pagerRef.current?.scrollTo(
      {
        x:
          newPage *
          contentWidth,

        y: 0,

        animated: true,
      }
    );
  }

  // ==========================================================
  // SWIPE DETECTION
  // ==========================================================

  function handleScroll(
    event
  ) {
    const x =
      event.nativeEvent
        .contentOffset.x;

    const newPage =
      Math.round(
        x /
          contentWidth
      );

    if (
      newPage >= 0 &&
      newPage <= 2
    ) {
      setPage(
        newPage
      );
    }
  }

  // ==========================================================
  // HOME UI
  // ==========================================================

  return (
    <SafeAreaView
      style={
        styles.darkSafeArea
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.background
        }
      />

      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerLeft
          }
        >
          <Text
            style={
              styles.houseNameText
            }
          >
            {houseName ||
              "My House"}
          </Text>

          <Text
            style={
              styles.logoSmall
            }
          >
            HomeHub
          </Text>
        </View>

        <View
          style={
            styles.headerRight
          }
        >
          <Text
            style={
              styles.userName
            }
          >
            {profileName}
          </Text>

          <Pressable
            onPress={
              logout
            }
          >
            <Text
              style={
                styles.logoutText
              }
            >
              Log out
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ================================================== */}
      {/* CENTERED LIQUID GLASS NAVIGATION                  */}
      {/* ================================================== */}

      <TopNavigation
        page={page}
        setPage={
          goToPage
        }
      />

      {/* ================================================== */}
      {/* CENTERED WEB CONTENT                              */}
      {/* ================================================== */}

      <View
        style={[
          styles.webContentContainer,

          Platform.OS === "web" && {
            width:
              contentWidth,

            alignSelf:
              "center",
          },

          Platform.OS !== "web" && {
            width: "100%",
          },
        ]}
      >
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={
            false
          }
          bounces={false}
          decelerationRate="fast"
          onMomentumScrollEnd={
            handleScroll
          }
          style={
            styles.horizontalPager
          }
        >
          {/* ================================================= */}
          {/* ACTIVITIES                                        */}
          {/* ================================================= */}

          <View
            style={[
              styles.pageWrapper,
              {
                width:
                  contentWidth,
              },
            ]}
          >
            <ActivitiesPage
              completions={
                completions
              }
              onDone={
                completeTask
              }
              onUndo={
                undoTask
              }
              actionLoading={
                actionLoading
              }
            />
          </View>

          {/* ================================================= */}
          {/* TRASH                                             */}
          {/* ================================================= */}

          <View
            style={[
              styles.pageWrapper,
              {
                width:
                  contentWidth,
              },
            ]}
          >
            <TrashPage
              completions={
                completions
              }
              onDone={
                completeTask
              }
              onUndo={
                undoTask
              }
              actionLoading={
                actionLoading
              }
            />
          </View>

          {/* ================================================= */}
          {/* HISTORY                                           */}
          {/* ================================================= */}

          <View
            style={[
              styles.pageWrapper,
              {
                width:
                  contentWidth,
              },
            ]}
          >
            <HistoryPage
              history={
                history
              }
              historyMode={
                historyMode
              }
              setHistoryMode={
                setHistoryMode
              }
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  const [session, setSession] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [houseId, setHouseId] =
    useState(null);

  const [
    houseName,
    setHouseName,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // AUTH SESSION
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setSession(
        session
      );

      setUser(
        session?.user ||
          null
      );

      setLoading(false);
    }

    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          newSession
        ) => {
          setSession(
            newSession
          );

          setUser(
            newSession?.user ||
              null
          );
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  // ==========================================================
  // LOAD HOUSE
  // ==========================================================

  useEffect(() => {
    if (!user) {
      setHouseId(null);
      setHouseName("");

      return;
    }

    loadUserHouse();
  }, [user]);

  async function loadUserHouse() {
    const {
      data,
      error,
    } =
      await supabase
        .from("house_members")
        .select(`
          house_id,
          houses (
            id,
            name,
            invite_code
          )
        `)
        .eq(
          "user_id",
          user.id
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      console.log(
        "House loading error:",
        error
      );

      return;
    }

    if (
      data?.house_id
    ) {
      setHouseId(
        data.house_id
      );

      setHouseName(
        data.houses?.name ||
          "My House"
      );
    } else {
      setHouseId(null);
      setHouseName("");
    }
  }

  // ==========================================================
  // HOUSE READY
  // ==========================================================

  async function handleHouseReady(
    id
  ) {
    setHouseId(id);

    await loadUserHouse();
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loginSafeArea
        }
      >
        <ActivityIndicator
          size="large"
          color="#111827"
        />

        <Text
          style={
            styles.loadingTextLight
          }
        >
          Loading HomeHub...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (
    !session ||
    !user
  ) {
    return (
      <AuthScreen
        onAuthenticated={(
          authenticatedUser
        ) => {
          setUser(
            authenticatedUser
          );
        }}
      />
    );
  }

  // ==========================================================
  // HOUSE SETUP
  // ==========================================================

  if (!houseId) {
    return (
      <HouseSetup
        user={user}
        onHouseReady={
          handleHouseReady
        }
      />
    );
  }

  // ==========================================================
  // MAIN APP
  // ==========================================================

  return (
    <HomeScreen
      user={user}
      houseId={
        houseId
      }
      houseName={
        houseName
      }
      onLogout={() => {
        setSession(null);
        setUser(null);
        setHouseId(null);
        setHouseName("");
      }}
    />
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    // ========================================================
    // GENERAL
    // ========================================================

    flex: {
      flex: 1,
    },

    // ========================================================
    // LOGIN — ALWAYS WHITE
    // ========================================================

    loginSafeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    authContainer: {
      flexGrow: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 24,
      paddingVertical: 40,

      backgroundColor:
        "#FFFFFF",
    },

    authCard: {
      width: "100%",

      maxWidth: 480,

      borderRadius: 28,

      padding: 30,

      backgroundColor:
        "#FFFFFF",
    },

    /*
      Border and shadow ONLY on web.
    */

    authCardWeb: {
      borderWidth: 1,

      borderColor:
        "#E1E4E9",

      minHeight: 520,

      justifyContent:
        "center",

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 12,
      },

      shadowOpacity:
        0.08,

      shadowRadius: 30,
    },

    loginLogo: {
      fontSize: 38,

      fontWeight:
        "800",

      color:
        "#172033",

      marginBottom: 8,
    },

    loginSubtitle: {
      fontSize: 16,

      color:
        "#8A8F9D",

      marginBottom: 35,
    },

    loginInputLabel: {
      fontSize: 14,

      fontWeight:
        "600",

      color:
        "#172033",

      marginBottom: 8,
      marginTop: 16,
    },

    loginInput: {
      height: 54,

      backgroundColor:
        "#FFFFFF",

      borderRadius: 14,

      paddingHorizontal: 16,

      fontSize: 16,

      color:
        "#172033",

      borderWidth: 1,

      borderColor:
        "#E1E4E9",
    },

    loginButton: {
      height: 54,

      borderRadius: 14,

      backgroundColor:
        "#111827",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 28,
    },

    loginButtonText: {
      color:
        "#FFFFFF",

      fontSize: 16,

      fontWeight:
        "700",
    },

    switchAuthButton: {
      alignItems:
        "center",

      marginTop: 22,

      paddingVertical: 12,
    },

    switchAuthText: {
      color:
        "#8A8F9D",

      fontSize: 14,

      fontWeight:
        "600",
    },

    loadingTextLight: {
      marginTop: 12,

      color:
        "#8A8F9D",

      fontSize: 15,
    },

    // ========================================================
    // DARK APP
    // ========================================================

    darkSafeArea: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    // ========================================================
    // HOUSE SETUP
    // ========================================================

    houseContainer: {
      flex: 1,

      paddingHorizontal: 24,

      paddingTop: 30,

      backgroundColor:
        COLORS.background,
    },

    logo: {
      fontSize: 38,

      fontWeight:
        "800",

      color:
        COLORS.text,

      marginBottom: 8,
    },

    houseWelcome: {
      fontSize: 24,

      fontWeight:
        "700",

      color:
        COLORS.text,

      marginTop: 35,
    },

    houseSubtitle: {
      color:
        COLORS.secondary,

      fontSize: 15,

      marginTop: 8,

      marginBottom: 25,
    },

    backText: {
      fontSize: 16,

      color:
        COLORS.secondary,

      fontWeight:
        "600",

      marginBottom: 30,
    },

    pageTitle: {
      fontSize: 30,

      fontWeight:
        "800",

      color:
        COLORS.text,

      marginBottom: 15,
    },

    inputLabel: {
      fontSize: 14,

      fontWeight:
        "600",

      color:
        COLORS.text,

      marginBottom: 8,

      marginTop: 16,
    },

    input: {
      height: 54,

      backgroundColor:
        COLORS.input,

      borderRadius: 14,

      paddingHorizontal: 16,

      fontSize: 16,

      color:
        COLORS.text,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    primaryButton: {
      height: 54,

      borderRadius: 14,

      backgroundColor:
        "#F5F7FA",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 28,
    },

    primaryButtonText: {
      color:
        "#111827",

      fontSize: 16,

      fontWeight:
        "700",
    },

    secondaryButton: {
      height: 54,

      borderRadius: 14,

      backgroundColor:
        COLORS.light,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 12,
    },

    secondaryButtonText: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight:
        "700",
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      minHeight: 76,

      paddingHorizontal: 18,

      paddingTop: 8,

      paddingBottom: 6,

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      backgroundColor:
        COLORS.background,
    },

    headerLeft: {
      flex: 1,
    },

    houseNameText: {
      fontSize: 13,

      color:
        COLORS.secondary,

      fontWeight:
        "600",

      marginBottom: 1,
    },

    logoSmall: {
      fontSize: 29,

      fontWeight:
        "800",

      color:
        COLORS.text,
    },

    headerRight: {
      alignItems:
        "flex-end",

      marginLeft: 10,
    },

    userName: {
      fontSize: 13,

      color:
        COLORS.text,

      fontWeight:
        "700",

      marginBottom: 5,
    },

    logoutText: {
      fontSize: 13,

      color:
        COLORS.secondary,

      fontWeight:
        "600",
    },

    // ========================================================
    // APPLE-STYLE LIQUID GLASS NAVIGATION
    // ========================================================

    liquidNavigation: {
      height: 54,

      alignSelf:
        "center",

      borderRadius: 28,

      flexDirection:
        "row",

      alignItems:
        "center",

      position:
        "relative",

      borderWidth: 1,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.20,

      shadowRadius: 14,

      elevation: 4,

      overflow:
        "hidden",

      marginBottom: 12,
    },

    liquidActivePill: {
      position:
        "absolute",

      left: 0,

      top: 4,

      height: 46,

      borderRadius: 24,

      borderWidth: 1,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.16,

      shadowRadius: 8,

      elevation: 3,
    },

    liquidNavigationItem: {
      height: 54,

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex: 2,
    },

    liquidNavigationText: {
      fontSize: 15,

      fontWeight:
        "700",
    },

    // ========================================================
    // CENTERED WEB CONTENT
    // ========================================================

    webContentContainer: {
      flex: 1,

      alignSelf:
        "center",
    },

    horizontalPager: {
      flex: 1,
    },

    pageWrapper: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    page: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    pageContent: {
      paddingHorizontal: 0,

      paddingTop: 20,

      paddingBottom: 40,
    },

    // ========================================================
    // SECTION
    // ========================================================

    sectionTitle: {
      fontSize: 29,

      fontWeight:
        "800",

      color:
        COLORS.text,

      marginBottom: 5,
    },

    sectionSubtitle: {
      fontSize: 15,

      color:
        COLORS.secondary,

      marginBottom: 24,
    },

    // ========================================================
    // TASKS
    // ========================================================

    taskList: {
      gap: 12,
    },

    taskCard: {
      backgroundColor:
        COLORS.card,

      minHeight: 82,

      borderRadius: 18,

      paddingHorizontal: 18,

      paddingVertical: 15,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    taskInfo: {
      flex: 1,

      paddingRight: 10,
    },

    taskTitle: {
      fontSize: 18,

      fontWeight:
        "700",

      color:
        COLORS.text,

      marginBottom: 4,
    },

    completedText: {
      fontSize: 14,

      color:
        COLORS.success,

      fontWeight:
        "500",
    },

    notCompletedText: {
      fontSize: 14,

      color:
        COLORS.secondary,
    },

    taskButton: {
      minWidth: 74,

      height: 44,

      borderRadius: 12,

      backgroundColor:
        "#F5F7FA",

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 12,
    },

    taskButtonText: {
      color:
        "#111827",

      fontSize: 14,

      fontWeight:
        "700",
    },

    undoButton: {
      backgroundColor:
        "transparent",
    },

    undoButtonText: {
      color:
        COLORS.secondary,

      fontSize: 14,

      fontWeight:
        "700",
    },

    // ========================================================
    // HISTORY TOGGLE
    // ========================================================

    historyToggle: {
      backgroundColor:
        COLORS.light,

      borderRadius: 14,

      padding: 4,

      flexDirection:
        "row",

      marginBottom: 24,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    historyToggleButton: {
      flex: 1,

      height: 42,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius: 11,
    },

    historyToggleButtonActive: {
      backgroundColor:
        COLORS.card,

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.20,

      shadowRadius: 5,

      elevation: 2,
    },

    historyToggleText: {
      color:
        COLORS.secondary,

      fontSize: 14,

      fontWeight:
        "700",
    },

    historyToggleTextActive: {
      color:
        COLORS.text,
    },

    // ========================================================
    // HISTORY
    // ========================================================

    historyWeek: {
      backgroundColor:
        COLORS.card,

      borderRadius: 18,

      padding: 16,

      marginBottom: 16,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    historyWeekTitle: {
      fontSize: 17,

      fontWeight:
        "800",

      color:
        COLORS.text,

      marginBottom: 10,
    },

    historyRow: {
      minHeight: 47,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    historyTask: {
      fontSize: 15,

      fontWeight:
        "600",

      color:
        COLORS.text,

      flex: 1,
    },

    historyPerson: {
      fontSize: 14,

      color:
        COLORS.success,

      fontWeight:
        "600",
    },

    historyNotDone: {
      color:
        COLORS.secondary,

      fontWeight:
        "400",
    },

    emptyHistory: {
      backgroundColor:
        COLORS.card,

      borderRadius: 18,

      padding: 25,

      alignItems:
        "center",

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    emptyHistoryText: {
      color:
        COLORS.secondary,

      fontSize: 15,
    },
  });