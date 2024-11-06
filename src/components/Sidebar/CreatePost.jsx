import {
	Box,
	Button,
	CloseButton,
	Flex,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Textarea,
	Tooltip,
	useDisclosure,
} from "@chakra-ui/react";
import { CreatePostLogo } from "../../assets/constants";
import { BsFillImageFill } from "react-icons/bs";
import { useRef, useState } from "react";
import usePreviewImg from "../../hooks/usePreviewImg";
import useShowToast from "../../hooks/useShowToast";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import useUserProfileStore from "../../store/userProfileStore";
import { useLocation } from "react-router-dom";
import { addDoc, arrayUnion, collection, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase/firebase"; // removed storage import

const CreatePost = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [caption, setCaption] = useState("");
	const imageRef = useRef(null);
	const { handleImageChange, selectedFile, setSelectedFile } = usePreviewImg();
	const showToast = useShowToast();
	const { isLoading, handleCreatePost } = useCreatePost();

	const handlePostCreation = async () => {
		try {
			await handleCreatePost(selectedFile, caption);
			onClose();
			setCaption("");
			setSelectedFile(null);
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	return (
		<>
			<Tooltip
				hasArrow
				label={"Create"}
				placement='right'
				ml={1}
				openDelay={500}
				display={{ base: "block", md: "none" }}
			>
				<Flex
					alignItems={"center"}
					gap={4}
					_hover={{ bg: "whiteAlpha.400" }}
					borderRadius={6}
					p={2}
					w={{ base: 10, md: "full" }}
					justifyContent={{ base: "center", md: "flex-start" }}
					onClick={onOpen}
				>
					<CreatePostLogo />
					<Box display={{ base: "none", md: "block" }}>Create</Box>
				</Flex>
			</Tooltip>

			<Modal isOpen={isOpen} onClose={onClose} size='xl'>
				<ModalOverlay />

				<ModalContent bg={"black"} border={"1px solid gray"}>
					<ModalHeader>Create Post</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<Textarea
							placeholder='Post caption...'
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
						/>

						<Input type='file' hidden ref={imageRef} onChange={handleImageChange} />

						<BsFillImageFill
							onClick={() => imageRef.current.click()}
							style={{ marginTop: "15px", marginLeft: "5px", cursor: "pointer" }}
							size={16}
						/>
						{selectedFile && (
							<Flex mt={5} w={"full"} position={"relative"} justifyContent={"center"}>
								<Image src={selectedFile} alt='Selected img' />
								<CloseButton
									position={"absolute"}
									top={2}
									right={2}
									onClick={() => {
										setSelectedFile(null);
									}}
								/>
							</Flex>
						)}
					</ModalBody>

					<ModalFooter>
						<Button mr={3} onClick={handlePostCreation} isLoading={isLoading}>
							Post
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;

function useCreatePost() {
	const showToast = useShowToast();
	const [isLoading, setIsLoading] = useState(false);
	const authUser = useAuthStore((state) => state.user);
	const createPost = usePostStore((state) => state.createPost);
	const addPost = useUserProfileStore((state) => state.addPost);
	const userProfile = useUserProfileStore((state) => state.userProfile);
	const { pathname } = useLocation();

	const handleCreatePost = async (selectedFile, caption) => {
		if (isLoading) return;
		if (!selectedFile) throw new Error("Please select an image");
		setIsLoading(true);

		const newPost = {
			caption: caption,
			likes: [],
			comments: [],
			createdAt: Date.now(),
			createdBy: authUser.uid,
		};

		try {
			// Step 1: Upload image to ImgBB
			const formData = new FormData();
			formData.append("image", selectedFile.split(",")[1]); // Extract the base64 data
			const imgbbApiKey = "f0073eead5168ab2358afe573165173c";
			const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
				method: "POST",
				body: formData,
			});
			const data = await response.json();

			if (!data.success) throw new Error("Image upload failed");

			const imageURL = data.data.url;

			// Step 2: Save the post to Firestore with the ImgBB image URL
			const postDocRef = await addDoc(collection(firestore, "posts"), {
				...newPost,
				imageURL,
			});
			const userDocRef = doc(firestore, "users", authUser.uid);

			await updateDoc(userDocRef, { posts: arrayUnion(postDocRef.id) });

			// Update the post store and show success message
			if (userProfile.uid === authUser.uid) createPost({ ...newPost, id: postDocRef.id, imageURL });
			if (pathname !== "/" && userProfile.uid === authUser.uid) addPost({ ...newPost, id: postDocRef.id, imageURL });

			showToast("Success", "Post created successfully", "success");
		} catch (error) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, handleCreatePost };
}
