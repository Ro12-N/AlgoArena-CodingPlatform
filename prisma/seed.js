const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

const sampleProblem = {
  title: "Climbing Stairs",
  description:
    "You are climbing a staircase. Each time you can climb either 1 step or 2 steps. Return the number of distinct ways to reach the top.",
  difficulty: "EASY",
  tags: ["Dynamic Programming", "Math"],
  constraints: "1 <= n <= 45",
  hints:
    "The answer for step n depends on the answers for steps n - 1 and n - 2.",
  editorial:
    "This is a Fibonacci-style dynamic programming problem. Track the previous two answers and build forward.",
  testCases: [
    { input: "2", output: "2" },
    { input: "3", output: "3" },
    { input: "5", output: "8" },
  ],
  examples: {
    JAVASCRIPT: {
      input: "n = 2",
      output: "2",
      explanation: "Two paths exist: 1 + 1 or 2.",
    },
    PYTHON: {
      input: "n = 3",
      output: "3",
      explanation: "Three paths exist: 1+1+1, 1+2, and 2+1.",
    },
    JAVA: {
      input: "n = 5",
      output: "8",
      explanation: "Each step count builds from the previous two counts.",
    },
  },
  codeSnippets: {
    JAVASCRIPT: `function climbStairs(n) {
  // Write your solution here
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim();
const n = Number(input);
console.log(climbStairs(n));`,
    PYTHON: `def climb_stairs(n):
    # Write your solution here
    pass

if __name__ == "__main__":
    import sys
    n = int(sys.stdin.readline().strip())
    print(climb_stairs(n))`,
    JAVA: `import java.util.Scanner;

class Main {
  static int climbStairs(int n) {
    // Write your solution here
    return 0;
  }

  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    int n = Integer.parseInt(scanner.nextLine().trim());
    System.out.println(climbStairs(n));
    scanner.close();
  }
}`,
  },
  referenceSolutions: {
    JAVASCRIPT: `function climbStairs(n) {
  if (n <= 2) {
    return n;
  }

  let prev = 1;
  let curr = 2;

  for (let step = 3; step <= n; step += 1) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }

  return curr;
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim();
const n = Number(input);
console.log(climbStairs(n));`,
    PYTHON: `def climb_stairs(n):
    if n <= 2:
        return n

    prev, curr = 1, 2
    for _ in range(3, n + 1):
        prev, curr = curr, prev + curr

    return curr

if __name__ == "__main__":
    import sys
    n = int(sys.stdin.readline().strip())
    print(climb_stairs(n))`,
    JAVA: `import java.util.Scanner;

class Main {
  static int climbStairs(int n) {
    if (n <= 2) {
      return n;
    }

    int prev = 1;
    int curr = 2;

    for (int step = 3; step <= n; step++) {
      int next = prev + curr;
      prev = curr;
      curr = next;
    }

    return curr;
  }

  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    int n = Integer.parseInt(scanner.nextLine().trim());
    System.out.println(climbStairs(n));
    scanner.close();
  }
}`,
  },
};

async function main() {
  const email = process.env.DEV_USER_EMAIL || "developer@local.test";
  const clerkId = "dev-local-user";

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
      firstName: "Local",
      lastName: "Developer",
      role: UserRole.ADMIN,
    },
    create: {
      clerkId,
      email,
      firstName: "Local",
      lastName: "Developer",
      role: UserRole.ADMIN,
    },
  });

  const existingProblem = await prisma.problem.findFirst({
    where: {
      title: sampleProblem.title,
      userId: user.id,
    },
  });

  if (!existingProblem) {
    await prisma.problem.create({
      data: {
        ...sampleProblem,
        userId: user.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
