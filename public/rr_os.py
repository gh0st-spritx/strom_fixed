import os
import time

def clear_screen():
    
    os.system('cls' if os.name == 'nt' else 'clear')

def boot_sequence(): 
    clear_screen()
    print("Initializing Resurrection Remix OS...")
    time.sleep(1)
    print("Loading core modules... [OK]")
    time.sleep(0.5)
    print("Mounting virtual drives... [OK]")
    time.sleep(0.5)
    clear_screen()
    print("==================================================")
    print("          RESURRECTION REMIX OS v1.0              ")
    print("==================================================")

def login():
    
    database = {"admin": "nsu123", "guest": "guest"}
    
    print("\n--- LOGIN ---")
    attempts = 3
    
    while attempts > 0:
        username = input("Username: ")
        password = input("Password: ")
        
        if username in database and database[username] == password:
            print("\nLogin successful! Welcome back, " + username + ".")
            time.sleep(1)
            return True
        else:
            attempts -= 1
            print(f"Access Denied. {attempts} attempts remaining.\n")
            
    print("System Locked. Please restart.")
    return False


def show_help():
    print("\n--- AVAILABLE COMMANDS ---")
    print("  help     : Show this menu")
    print("  calc     : Open the Math Calculator")
    print("  notes    : Open the Text Note Taker")
    print("  clear    : Clear the terminal screen")
    print("  logout   : Log out of Resurrection Remix")
    print("--------------------------\n")

def app_calculator():
    print("\n--- CALCULATOR APP ---")
    print("Type 'exit' to close the app.")
    
    while True:
        num1 = input("\nEnter first number (or 'exit'): ")
        if num1.lower() == 'exit':
            break
            
        op = input("Enter operator (+, -, *, /): ")
        num2 = input("Enter second number: ")
        
        try:
            n1 = float(num1)
            n2 = float(num2)
            
            if op == '+': print(f"Result: {n1 + n2}")
            elif op == '-': print(f"Result: {n1 - n2}")
            elif op == '*': print(f"Result: {n1 * n2}")
            elif op == '/': 
                if n2 == 0:
                    print("Error: Division by zero!")
                else:
                    print(f"Result: {n1 / n2}")
            else:
                print("Invalid operator!")
        except ValueError:
            print("Error: Please enter valid numbers.")

def app_notes():
    print("\n--- NOTES APP ---")
    print("1. Write a new note")
    print("2. Read existing notes")
    print("3. Exit app")
    
    choice = input("Select an option (1-3): ")
    
    if choice == '1':
        with open("rr_notes.txt", "a") as file:
            note = input("\nType your note: ")
            file.write(note + "\n")
            print("Note saved successfully!")
            
    elif choice == '2':
        print("\n--- YOUR NOTES ---")
        try:
            with open("rr_notes.txt", "r") as file:
                content = file.readlines()
                if len(content) == 0:
                    print("No notes found. It's empty.")
                else:
                    for line in content:
                        print("- " + line.strip())
        except FileNotFoundError:
            print("No saved notes found. Write one first!")
            
    elif choice == '3':
        return
    else:
        print("Invalid choice.")

def start_os():
    boot_sequence()
    
    if login():
        clear_screen()
        print("Resurrection Remix OS Loaded. Type 'help' to see commands.")
        
        while True:
            command = input("\nrr-os> ").lower().strip()
            
            if command == "help":
                show_help()
            elif command == "calc":
                app_calculator()
            elif command == "notes":
                app_notes()
            elif command == "clear":
                clear_screen()
                print("Resurrection Remix OS. Type 'help' for commands.")
            elif command == "logout" or command == "exit":
                print("Shutting down Resurrection Remix... Goodbye!")
                time.sleep(1)
                clear_screen()
                break 
            elif command == "":
                continue
            else:
                print(f"Command '{command}' not recognized. Type 'help'.")

if __name__ == "__main__":
    start_os()
