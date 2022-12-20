cmake_minimum_required (VERSION 3.2)
project (Denoise)

set (CMAKE_CXX_STANDARD 17)

########################################

include_directories(
    ${CMAKE_SOURCE_DIR}/src
    ${CMAKE_SOURCE_DIR}/src/ext
)

file(GLOB SOURCE_FILE
    ${CMAKE_SOURCE_DIR}/src/*.h
    ${CMAKE_SOURCE_DIR}/src/*.cpp
    ${CMAKE_SOURCE_DIR}/src/util/*.h
    ${CMAKE_SOURCE_DIR}/src/util/*.cpp
    ${CMAKE_SOURCE_DIR}/src/ext/*/*.h
)

# Sort the file into different folders
foreach(_source_file IN ITEMS ${SOURCE_FILE})
    get_filename_component(_source_path "${_source_file}" PATH)
    string(REPLACE "${CMAKE_SOURCE_DIR}" "" _group_path "${_source_path}")
    string(REPLACE "/" "\\" _group_path "${_group_path}")
    source_group("${_group_path}" FILES "${_source_file}")
endforeach()

########################################

# OpenMP
FIND_PACKAGE(OpenMP)
if(OPENMP_FOUND)
    message("OPENMP FOUND")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${OpenMP_C_FLAGS}")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${OpenMP_CXX_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${OpenMP_EXE_LINKER_FLAGS}")
endif()

########################################

add_executable(Denoise ${SOURCE_FILE})