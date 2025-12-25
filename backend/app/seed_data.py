"""
Seed script to initialize the database with tables only (no sample data).
This ensures a clean schema is ready for production use.
"""

from .database import SessionLocal, engine
from . import models
from sqlalchemy import text
# auth_utils import is still needed for the student model dependency on startup
from .auth_utils import get_password_hash 


def seed_database():
    """Initialize the database tables without populating sample data."""
    db = SessionLocal()
    
    # --- CRITICAL: Drop all existing tables to apply the new schema ---
    try:
        # Drop all tables with CASCADE to handle dependencies and ensure the new schema is used
        db.execute(text("DROP TABLE IF EXISTS course_reviews CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS course_prerequisites CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS ratings CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS students CASCADE")) 
        db.execute(text("DROP TABLE IF EXISTS courses CASCADE"))
        db.commit()
        print("Existing tables dropped successfully.")
    except Exception as e:
        db.rollback()
        # This will still print a warning if a table didn't exist, but it's safe.
        print(f"Warning during DROP (may occur if tables didn't exist): {e}") 
    
    # Create all tables (Now includes 'hashed_password' on the students table)
    models.Base.metadata.create_all(bind=engine)
    print("Database schema created successfully (tables: students, courses, ratings, course_reviews).")
    
    # --- ADD SAMPLE COURSES ---
    sample_courses = [
        # Core Mathematics
        models.Course(id=90901, name="Calculus 1", description="Limits, derivatives, and integrals of single-variable functions.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=90905, name="Linear Algebra", description="Systems of linear equations, matrices, and vector spaces.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=90926, name="Discrete Mathematics", description="Set theory, logic, and combinatorics.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=90902, name="Calculus 2", description="Advanced integration and multi-variable functions.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=90911, name="Intro to Probability", description="Axioms of probability and random variables.", workload=4, credits=3.5, status="Mandatory"),
        models.Course(id=90923, name="Mathematical Logic for CS", description="Propositional and predicate logic.", workload=5, credits=3.5, status="Mandatory"),
        models.Course(id=90954, name="Linear Algebra 2", description="Inner product spaces and linear transformations.", workload=6, credits=5.0, status="Mandatory"),
        
        # Core CS - Intro and Fundamentals
        models.Course(id=10016, name="Intro to Computer Science", description="Fundamentals of programming and problem-solving.", workload=6, credits=4.5, status="Mandatory"),
        models.Course(id=10128, name="Object Oriented Programming", description="Advanced programming, inheritance, and polymorphism.", workload=6, credits=4.5, status="Mandatory"),
        models.Course(id=10145, name="Computer Org. & Assembly", description="Computer architecture and low-level programming.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=10117, name="Data Structures", description="Linked lists, trees, and hash tables.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=10010, name="Intro to System Programming", description="C programming and memory management.", workload=4, credits=3.0, status="Mandatory"),
        
        # Core CS - Theory
        models.Course(id=10139, name="Computational Models", description="Automata theory and formal languages.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=10120, name="Analysis of Algorithms", description="Algorithm efficiency and complexity theory.", workload=6, credits=5.0, status="Mandatory"),
        models.Course(id=10013, name="Computer Communications", description="Network layers and TCP/IP protocols.", workload=4, credits=3.5, status="Mandatory"),
        
        # Core CS - Systems
        models.Course(id=10303, name="Operating Systems", description="Process management and file systems.", workload=4, credits=3.5, status="Mandatory"),
        models.Course(id=10324, name="Parallel Computation", description="Multi-threading and parallel algorithms.", workload=5, credits=4.0, status="Mandatory"),
        models.Course(id=10334, name="Compilation", description="Compiler design and syntax analysis.", workload=4, credits=3.5, status="Mandatory"),
        
        # Core CS - Projects and Capstone
        models.Course(id=11402, name="CS Project - Part 1", description="Initial phase of final development project.", workload=2, credits=4.0, status="Mandatory"),
        models.Course(id=11403, name="CS Project - Part 2", description="Final phase and presentation of project.", workload=2, credits=0.0, status="Mandatory"),
        models.Course(id=11015, name="CS Seminar", description="Research-based seminar on CS topics.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Additional Seminars and Advanced Topics
        models.Course(id=10352, name="Cyber Seminar", description="Advanced research in data security.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10355, name="ML Seminar", description="Research in Machine Learning applications.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10356, name="Languages Seminar", description="Research in programming language paradigms.", workload=3, credits=2.5, status="Selective"),
        
        # Core CS - Software Engineering
        models.Course(id=10014, name="Software Engineering", description="Software lifecycle and design methodologies.", workload=5, credits=4.0, status="Mandatory"),
        models.Course(id=10121, name="Advanced Algorithms", description="Complex algorithms and optimization.", workload=5, credits=4.0, status="Mandatory"),
        
        # Selective - AI and Machine Learning
        models.Course(id=19101, name="Intro to AI", description="Basic AI concepts and search algorithms.", workload=3, credits=2.5, status="Mandatory"),
        models.Course(id=10245, name="Machine Learning", description="Supervised and unsupervised learning.", workload=4, credits=3.0, status="Selective"),
        models.Course(id=10240, name="Deep Learning", description="Neural networks and deep architectures.", workload=4, credits=3.0, status="Selective"),
        models.Course(id=10243, name="CNN for CV", description="Deep learning for vision tasks.", workload=4, credits=3.0, status="Selective"),
        models.Course(id=10247, name="NLP", description="Computational analysis of language.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10207, name="AI for Games", description="AI techniques for game mechanics.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Security
        models.Course(id=10313, name="Data Security", description="Cryptography and network security.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10227, name="Cyber Security", description="Defense and offensive security.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10228, name="Network Security", description="Securing communication channels.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10233, name="Secure Development", description="Writing exploit-free code.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10248, name="Modern Cryptography", description="Advanced encryption foundations.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10234, name="Mobile Security", description="Security for mobile applications.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Databases
        models.Course(id=10127, name="Database Systems", description="Relational databases and SQL.", workload=4, credits=3.0, status="Selective"),
        models.Course(id=10351, name="Big Data Analytics", description="Large scale data processing.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Web and UI/UX
        models.Course(id=10266, name="Web Platforms", description="Modern web development frameworks.", workload=4, credits=3.0, status="Selective"),
        models.Course(id=10208, name="User Interface Development", description="Building interactive user interfaces.", workload=6, credits=4.0, status="Selective"),
        models.Course(id=10147, name="UI Characterization", description="UX design and user requirements.", workload=5, credits=4.0, status="Selective"),
        models.Course(id=10225, name="UI Visual Design", description="Aesthetics and visual hierarchy.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Graphics and Vision
        models.Course(id=10342, name="Computer Graphics", description="2D/3D image generation models.", workload=5, credits=4.0, status="Selective"),
        models.Course(id=10224, name="Computer Vision", description="Image processing and detection.", workload=4, credits=3.0, status="Selective"),
        
        # Selective - Game Development
        models.Course(id=10220, name="Game Development", description="Game engines and physics.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10267, name="Game Workshop", description="Practical computer game production.", workload=3, credits=2.5, status="Selective"),
        
        # Selective - Mobile and Embedded
        models.Course(id=10219, name="IOS Development", description="Mobile app development for IOS.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10110, name="Embedded Systems", description="Low-level hardware programming.", workload=4, credits=2.5, status="Selective"),
        
        # Selective - Programming Languages
        models.Course(id=10212, name="Dot Net Programming", description="Application development in C#.", workload=6, credits=4.0, status="Selective"),
        models.Course(id=10216, name="OOP Workshop C++", description="Advanced system-level OOP.", workload=4, credits=3.0, status="Selective"),
        
        # Selective - Advanced Topics
        models.Course(id=10250, name="Advanced Algorithms 2", description="Randomized and online algorithms.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10346, name="Agile Methods", description="Modern development methodologies.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10354, name="Blockchain", description="Distributed ledgers and smart contracts.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10237, name="Social Networks", description="Graph theory in social analysis.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10358, name="Network Analysis", description="Mathematical connectivity models.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10359, name="Autonomous Vehicles", description="AI and robotics human factors.", workload=3, credits=2.5, status="Selective"),
        models.Course(id=10015, name="Statistics", description="Statistical inference and testing.", workload=4, credits=3.0, status="Selective"),
        
        # Selective - Tools and Languages
        models.Course(id=10142, name="Development Tools", description="Use of IDEs, Git, and build tools.", workload=2, credits=1.0, status="Selective"),
        models.Course(id=10149, name="Programming Languages", description="Principles of syntax and semantics.", workload=5, credits=4.0, status="Selective"),
        models.Course(id=10206, name="Information Theory", description="Entropy and data compression.", workload=4, credits=2.5, status="Selective"),
        models.Course(id=10827, name="Software Ethics", description="Ethical issues in software development.", workload=3, credits=3.0, status="Selective"),
        
        # Service Courses
        models.Course(id=40112, name="Operation Research", description="Mathematical system optimization.", workload=4, credits=3.0, status="Service"),
        models.Course(id=40120, name="Stochastic Models", description="Probability system behavior models.", workload=4, credits=3.0, status="Service"),
        models.Course(id=40215, name="Game Theory", description="Strategic decision-making models.", workload=3, credits=2.5, status="Service"),
        models.Course(id=40225, name="Data Mining", description="Massive data pattern extraction.", workload=3, credits=2.5, status="Service"),
        models.Course(id=40236, name="Optimization Methods", description="Mathematical efficiency methods.", workload=3, credits=2.5, status="Service"),
    ]
    
    db.add_all(sample_courses)
    db.commit()
    print("Sample courses added successfully (67 CS curriculum courses).")
    
    # --- ADD COURSE PREREQUISITES ---
    prerequisites_data = [
        # Calculus 2 prerequisites
        (90902, 90901),  # Calculus 2 requires Calculus 1
        (90902, 90905),  # Calculus 2 requires Linear Algebra
        
        # Intro to Probability prerequisites
        (90911, 90901),  # requires Calculus 1
        
        # OOP prerequisites
        (10128, 10016),  # requires Intro to CS
        
        # Computer Org prerequisites
        (10145, 10016),  # requires Intro to CS
        
        # Mathematical Logic prerequisites
        (90923, 90926),  # requires Discrete Math
        
        # Data Structures prerequisites
        (10117, 10016),  # requires Intro to CS
        
        # System Programming prerequisites
        (10010, 10128),  # requires OOP
        
        # Linear Algebra 2 prerequisites
        (90954, 90905),  # requires Linear Algebra
        
        # Intro to AI prerequisites
        (19101, 90911),  # requires Probability
        (19101, 90926),  # requires Discrete Math
        (19101, 10016),  # requires Intro to CS
        
        # Computer Communications prerequisites
        (10013, 10145),  # requires Computer Org
        
        # Computational Models prerequisites
        (10139, 90923),  # requires Mathematical Logic
        
        # Analysis of Algorithms prerequisites
        (10120, 10117),  # requires Data Structures
        
        # Operating Systems prerequisites
        (10303, 10145),  # requires Computer Org
        (10303, 10010),  # requires System Programming
        
        # Parallel Computation prerequisites
        (10324, 10120),  # requires Analysis of Algorithms
        
        # Compilation prerequisites
        (10334, 10139),  # requires Computational Models
        
        # CS Project Part 1 prerequisites
        (11402, 10120),  # requires Analysis of Algorithms
        
        # Software Engineering prerequisites
        (10014, 10128),  # requires OOP
        
        # Advanced Algorithms prerequisites
        (10121, 10120),  # requires Analysis of Algorithms
        (10121, 10139),  # requires Computational Models
        
        # CS Project Part 2 prerequisites
        (11403, 11402),  # requires CS Project Part 1
        
        # CS Seminar prerequisites
        (11015, 10120),  # requires Analysis of Algorithms
        
        # Data Security prerequisites
        (10313, 90905),  # requires Linear Algebra
        (10313, 90911),  # requires Probability
        (10313, 10013),  # requires Computer Communications
        
        # Machine Learning prerequisites
        (10245, 90911),  # requires Probability
        (10245, 10117),  # requires Data Structures
        
        # User Interface Development prerequisites
        (10208, 10128),  # requires OOP
        (10208, 10147),  # requires UI Characterization
        
        # Cyber Security prerequisites
        (10227, 90905),  # requires Linear Algebra
        (10227, 10313),  # requires Data Security
        
        # Web Platforms prerequisites
        (10266, 10016),  # requires Intro to CS
        
        # Operation Research prerequisites
        (40112, 90905),  # requires Linear Algebra
        (40112, 90911),  # requires Probability
        
        # Deep Learning prerequisites
        (10240, 90911),  # requires Probability
        (10240, 10245),  # requires Machine Learning
        
        # Computer Graphics prerequisites
        (10342, 10010),  # requires System Programming
        
        # UI Characterization prerequisites
        (10147, 10016),  # requires Intro to CS
        
        # AI for Games prerequisites
        (10207, 10120),  # requires Analysis of Algorithms
        (10207, 10010),  # requires System Programming
        
        # Embedded Systems prerequisites
        (10110, 10010),  # requires System Programming
        (10110, 10145),  # requires Computer Org
        (10110, 10016),  # requires Intro to CS
        
        # Dot Net Programming prerequisites
        (10212, 10128),  # requires OOP
        
        # OOP Workshop C++ prerequisites
        (10216, 10128),  # requires OOP
        (10216, 10010),  # requires System Programming
        
        # IOS Development prerequisites
        (10219, 10208),  # requires UI Development
        
        # Game Development prerequisites
        (10220, 10128),  # requires OOP
        
        # Computer Vision prerequisites
        (10224, 10245),  # requires Machine Learning
        
        # UI Visual Design prerequisites
        (10225, 10208),  # requires UI Development
        
        # Network Security prerequisites
        (10228, 10313),  # requires Data Security
        
        # Secure Development prerequisites
        (10233, 10128),  # requires OOP
        
        # Mobile Security prerequisites
        (10234, 10208),  # requires UI Development
        (10234, 10313),  # requires Data Security
        
        # Social Networks prerequisites
        (10237, 10120),  # requires Analysis of Algorithms
        (10237, 90911),  # requires Probability
        
        # CNN for CV prerequisites
        (10243, 10224),  # requires Computer Vision
        
        # NLP prerequisites
        (10247, 90911),  # requires Probability
        (10247, 10245),  # requires Machine Learning
        
        # Modern Cryptography prerequisites
        (10248, 90911),  # requires Probability
        (10248, 90905),  # requires Linear Algebra
        (10248, 10313),  # requires Data Security
        
        # Advanced Algorithms 2 prerequisites
        (10250, 90911),  # requires Probability
        (10250, 10121),  # requires Advanced Algorithms
        
        # Game Workshop prerequisites
        (10267, 10220),  # requires Game Development
        
        # Agile Methods prerequisites
        (10346, 10014),  # requires Software Engineering
        
        # Big Data Analytics prerequisites
        (10351, 10127),  # requires Database Systems
        (10351, 90911),  # requires Probability
        
        # Blockchain prerequisites
        (10354, 10128),  # requires OOP
        
        # Network Analysis prerequisites
        (10358, 90911),  # requires Probability
        
        # Autonomous Vehicles prerequisites
        (10359, 10015),  # requires Statistics
        (10359, 10128),  # requires OOP
        
        # Statistics prerequisites
        (10015, 90911),  # requires Probability
        
        # Stochastic Models prerequisites
        (40120, 40112),  # requires Operation Research
        (40120, 90911),  # requires Probability
        
        # Game Theory prerequisites
        (40215, 90905),  # requires Linear Algebra
        (40215, 90911),  # requires Probability
        
        # Data Mining prerequisites
        (40225, 10127),  # requires Database Systems
        (40225, 90911),  # requires Probability
        
        # Optimization Methods prerequisites
        (40236, 90902),  # requires Calculus 2
        (40236, 90926),  # requires Discrete Math
        (40236, 10120),  # requires Analysis of Algorithms
    ]
    
    # Add all prerequisites
    for course_id, required_id in prerequisites_data:
        prerequisite = models.CoursePrerequisite(course_id=course_id, required_course_id=required_id)
        db.add(prerequisite)
    db.commit()
    print(f"Course prerequisites added successfully ({len(prerequisites_data)} relationships).")
    
    # --- ADD DEMO STUDENT ---
    demo_student = models.Student(
        name="demo",
        hashed_password=get_password_hash("demo123"),
        faculty="Computer Science",
        year=3
    )
    db.add(demo_student)
    db.commit()
    print("Demo student created successfully (username: demo, password: demo123).")
    
    # --- ADD SAMPLE COURSE REVIEWS ---
    sample_reviews = [
        models.CourseReview(
            student_id=1,
            course_id=10016,  # Intro to Computer Science
            languages_learned="Python, JavaScript",
            course_outputs="Personal Portfolio Website, Small Projects",
            industry_relevance_text="Foundation for all CS careers",
            instructor_feedback="Excellent teaching methodology and clear explanations",
            useful_learning_text="Essential fundamentals learned",
            industry_relevance_rating=5,
            instructor_rating=5,
            useful_learning_rating=5,
            final_score=10.0
        ),
        models.CourseReview(
            student_id=1,
            course_id=10117,  # Data Structures
            languages_learned="Python, Advanced OOP",
            course_outputs="Multiple algorithm implementations, Data structure projects",
            industry_relevance_text="Essential for backend development positions",
            instructor_feedback="Great depth of knowledge, challenging assignments",
            useful_learning_text="Very useful for production-level coding",
            industry_relevance_rating=5,
            instructor_rating=4,
            useful_learning_rating=5,
            final_score=9.4
        ),
        models.CourseReview(
            student_id=1,
            course_id=10208,  # User Interface Development
            languages_learned="React, JavaScript ES6+",
            course_outputs="Interactive React Components, Full App",
            industry_relevance_text="Very relevant for modern frontend development",
            instructor_feedback="Good course content, could use more examples",
            useful_learning_text="Practical knowledge for frontend jobs",
            industry_relevance_rating=5,
            instructor_rating=4,
            useful_learning_rating=4,
            final_score=8.8
        ),
    ]
    
    db.add_all(sample_reviews)
    db.commit()
    print("Sample course reviews added successfully.")
    
    # --- ADD SKILLS (Technical and Human) ---
    technical_skills = [
        models.Skill(name="Python", type="technical", description="Python programming language"),
        models.Skill(name="JavaScript", type="technical", description="JavaScript programming language"),
        models.Skill(name="SQL", type="technical", description="Relational database language"),
        models.Skill(name="React", type="technical", description="React.js for frontend development"),
        models.Skill(name="Node.js", type="technical", description="Node.js for backend development"),
        models.Skill(name="TensorFlow", type="technical", description="ML framework"),
        models.Skill(name="C++", type="technical", description="C++ programming language"),
        models.Skill(name="AWS", type="technical", description="Amazon Web Services"),
        models.Skill(name="Docker", type="technical", description="Containerization"),
        models.Skill(name="Git", type="technical", description="Version control"),
    ]
    human_skills = [
        models.Skill(name="Teamwork", type="human", description="Works well in teams"),
        models.Skill(name="Communication", type="human", description="Clear communicator"),
        models.Skill(name="Self-learner", type="human", description="Able to learn independently"),
        models.Skill(name="Problem-solving", type="human", description="Strong at solving new problems"),
        models.Skill(name="Adaptability", type="human", description="Quick to adjust to change"),
        models.Skill(name="Leadership", type="human", description="Can lead projects or teams"),
    ]
    db.add_all(technical_skills + human_skills)
    db.commit()

    # --- ADD CAREER GOALS ---
    backend = models.CareerGoal(name="Backend Developer", description="Builds server-side logic and APIs.")
    frontend = models.CareerGoal(name="Frontend Developer", description="Develops the user interface of apps.")
    fullstack = models.CareerGoal(name="Full Stack Developer", description="Handles both frontend and backend.")
    mobile = models.CareerGoal(name="Mobile Developer", description="Creates mobile apps for Android/iOS.")
    datascientist = models.CareerGoal(name="Data Scientist", description="Handles data analysis and visualization.")
    dataanalyst = models.CareerGoal(name="Data Analyst", description="Analyzes datasets to find insights.")
    mlengineer = models.CareerGoal(name="Machine Learning Engineer", description="Designs and deploys ML models.")
    devops = models.CareerGoal(name="DevOps Engineer", description="Enables CI/CD and infrastructure as code.")
    cloudarchitect = models.CareerGoal(name="Cloud Architect", description="Designs cloud-based systems.")
    uxdesigner = models.CareerGoal(name="UX Designer", description="Designs user experiences.")
    qaengineer = models.CareerGoal(name="QA Engineer", description="Assures software quality before release.")
    securityengineer = models.CareerGoal(name="Security Engineer", description="Protects systems against threats.")
    productmanager = models.CareerGoal(name="Product Manager", description="Oversees product lifecycle.")
    embeddedsystems = models.CareerGoal(name="Embedded Systems Engineer", description="Works with hardware/firmware.")
    db.add_all([
        backend, frontend, fullstack, mobile, datascientist, dataanalyst, mlengineer,
        devops, cloudarchitect, uxdesigner, qaengineer, securityengineer, productmanager, embeddedsystems
    ])
    db.commit()

    # --- ASSIGN SKILLS TO CAREER GOALS ---
    # Query the ids just inserted
    skill_map = {s.name: s for s in db.query(models.Skill).all()}
    # Assigns for brevity
    def t(name): return skill_map[name] if name in skill_map else None
    def h(name): return skill_map[name] if name in skill_map else None

    backend.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id), models.CareerGoalTechnicalSkill(skill_id=t("SQL").id), models.CareerGoalTechnicalSkill(skill_id=t("Node.js").id), models.CareerGoalTechnicalSkill(skill_id=t("Git").id)]
    backend.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Teamwork").id), models.CareerGoalHumanSkill(skill_id=h("Problem-solving").id)]

    frontend.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("JavaScript").id), models.CareerGoalTechnicalSkill(skill_id=t("React").id), models.CareerGoalTechnicalSkill(skill_id=t("Git").id)]
    frontend.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Communication").id), models.CareerGoalHumanSkill(skill_id=h("Adaptability").id)]

    fullstack.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id), models.CareerGoalTechnicalSkill(skill_id=t("JavaScript").id), models.CareerGoalTechnicalSkill(skill_id=t("SQL").id), models.CareerGoalTechnicalSkill(skill_id=t("React").id)]
    fullstack.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Teamwork").id), models.CareerGoalHumanSkill(skill_id=h("Self-learner").id)]

    mobile.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("JavaScript").id), models.CareerGoalTechnicalSkill(skill_id=t("Git").id)]
    mobile.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Adaptability").id), models.CareerGoalHumanSkill(skill_id=h("Problem-solving").id)]

    datascientist.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id), models.CareerGoalTechnicalSkill(skill_id=t("SQL").id)]
    datascientist.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Problem-solving").id), models.CareerGoalHumanSkill(skill_id=h("Self-learner").id)]

    dataanalyst.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("SQL").id), models.CareerGoalTechnicalSkill(skill_id=t("Python").id)]
    dataanalyst.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Communication").id)]

    mlengineer.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id), models.CareerGoalTechnicalSkill(skill_id=t("TensorFlow").id), models.CareerGoalTechnicalSkill(skill_id=t("SQL").id)]
    mlengineer.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Self-learner").id), models.CareerGoalHumanSkill(skill_id=h("Problem-solving").id)]

    devops.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Docker").id), models.CareerGoalTechnicalSkill(skill_id=t("AWS").id), models.CareerGoalTechnicalSkill(skill_id=t("Python").id)]
    devops.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Teamwork").id), models.CareerGoalHumanSkill(skill_id=h("Communication").id)]

    cloudarchitect.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("AWS").id), models.CareerGoalTechnicalSkill(skill_id=t("Docker").id)]
    cloudarchitect.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Leadership").id), models.CareerGoalHumanSkill(skill_id=h("Adaptability").id)]

    uxdesigner.technical_skills = []
    uxdesigner.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Communication").id)]

    qaengineer.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id)]
    qaengineer.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Problem-solving").id)]

    securityengineer.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("Python").id), models.CareerGoalTechnicalSkill(skill_id=t("C++").id)]
    securityengineer.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Adaptability").id)]

    productmanager.technical_skills = []
    productmanager.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Leadership").id), models.CareerGoalHumanSkill(skill_id=h("Communication").id)]

    embeddedsystems.technical_skills = [models.CareerGoalTechnicalSkill(skill_id=t("C++").id)]
    embeddedsystems.human_skills = [models.CareerGoalHumanSkill(skill_id=h("Self-learner").id)]

    db.commit()
    print("Sample career goals and skills added successfully.")
    db.close()


if __name__ == "__main__":
    seed_database()