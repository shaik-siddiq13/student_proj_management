# 1.create a list of 5 numbers and print all elements

numbers = [13,7,9,50,100]
print(numbers)


# 2. Add an element at the end and at the beggining

numbers.append(60)
print(numbers)

numbers.insert(0,10)
print(numbers)


# 3.Remove a specific element from the list

numbers.remove(100)
print(numbers)


# 4. Find the largest and smallest element in list

print(max(numbers))
print(min(numbers))


# 5. Reverse a list

numbers.reverse()
print(numbers)


# 6. Count how many times an element appears

print(numbers.count(13))


# 7. Remove duplicates from a list

b = [1, 2, 2, 3, 4, 4]

unique = []

for i in b:
    if i not in unique:
        unique.append(i)

print(unique)


# 8.Rotate list by k poitions

list1 = [1, 2, 3, 4, 5]

k = 2

first_part = list1[-k:]
second_part = list1[:-k]
new_list = first_part + second_part

print(new_list)


# 9.Find the second largest number

c = [20,10,15,38,40]

c.remove(max(c))
print("Second Largest :",max(c))


# 10.Flatten a Nested list

nested = [[10,20],[40],[50]] 

flat = []

for i in nested:
    for j in i:
        flat.append(j)

print(flat)





# 1. Create a set and print elements

a = {10, 20, 30, 40}

print(a)


# 2. Add and remove elements

a.add(50)

a.remove(20)

print(a)


# 3. Check membership of an element

print(30 in a)


# 4. Perform union of two sets

set1 = {1, 2, 3}

set2 = {3, 4, 5}

print(set1.union(set2))


# 5. Perform intersection of two sets

print(set1.intersection(set2))



# 6. Find difference between two sets

print(set1.difference(set2))


# 7. Convert list with duplicates into a set

list1 = [1, 2, 2, 3, 4, 4]

print(set(list1))


# 8. Find symmetric difference manually

a = {1, 2, 3}

b = {3, 4, 5}

print((a - b) | (b - a))


# 9. Check if two sets are disjoint

x = {1, 2}

y = {3, 4}

print(x.isdisjoint(y))


# 10. Find common elements in multiple sets

s1 = {1, 2, 3, 4}

s2 = {2, 3, 5}

s3 = {2, 6, 3}

print(s1.intersection(s2, s3))










# 1. Create a dictionary and print keys & values

student = {
    "name": "Siddiq",
    "age": 22}

print(student.keys())
print(student.values())


# 2. Add and update a key-value pair

student["course"] = "Python"

student["age"] = 23

print(student)


# 3. Delete a key from dictionary

del student["course"]

print(student)



# 4. Count frequency of elements in a list using dictionary

numbers = [1, 2, 2, 3, 1, 2]

freq = {}

for i in numbers:
    freq[i] = numbers.count(i)

print(freq)


# 5. Merge two dictionaries

a = {"x": 1}

b = {"y": 2}

a.update(b)

print(a)



# 6. Sort dictionary by values

data = {"a": 3, "b": 1, "c": 2}

sorted_data = dict(sorted(data.items(), key=lambda x: x[1]))

print(sorted_data)


# 7. Get key with maximum value

marks = {"math": 90,"science": 95,"english": 80}

print(max(marks, key=marks.get))


# 8. Group words by their length

words = ["hi", "hello", "cat", "python"]

result = {}

for i in words:
    length = len(i)

    result[length] = result.get(length, [])

    result[length].append(i)

print(result)


# 9. Find first non-repeating character in a string

text = "aabbcddee"

for i in text:
    if text.count(i) == 1:
        print(i)
        break


# 10. Student management system using dictionary

students = {1: "Siddiq",2: "Bob",3: "Mahesh"}

print(students)









# 1. Create a tuple wih 5 elements 

t = (10,20,30,40,50)

print(t)


# 2. Access first and last elements

print(t[0])
print(t[-1])


# 3. Count occurences of an element

print(t.count(10))


# 4. Find max and min values in a tuple 

print(max(t))
print(min(t))


# 5. Convert tuple → list → modify → back to tuple

c = (1, 2, 3)

list1 = list(c)

list1.append(4)

c = tuple(list1)

print(c)


# 6. Slice a tuple to get middle elements 

d = (1,2,3,4,5,6,7,8)

print(d[3:6])


# 7.Check if an element exists in tuple 

e = (100, 200, 300)


print(200 in e)

# 8. Swap two tuples

f = (1,2,3)
g = (4,5,6)

f,g = g,f

print(f)
print(g)

# 9. Find all pairs in tuple whose sum = target


nums = (1, 2, 3, 4, 5)

target = 5

for i in nums:
    for j in nums:

        if i + j == target:
            print(i, j)


# 10. Remove duplicates from tuple manually 


a = (1, 2, 2, 3, 4, 4)

b = set(a)

print(tuple(b))

    
